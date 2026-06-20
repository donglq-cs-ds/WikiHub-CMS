import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { CustomLatex } from './CustomLatexExtension';
import { createCustomMention } from './CustomMentionExtension';
import { CustomInfoBox } from './CustomInfoBoxExtension';
import { CustomImage } from './CustomImageExtension';
import { CustomTable } from './CustomTableExtension';

import {
    ArrowLeft, Save, Undo2, Redo2, Bold, Italic, Strikethrough, Underline as UnderlineIcon,
    Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Quote, Link2, Image as ImageIcon, Plus, LayoutTemplate, Grid,
    Sigma, Layout, Minus, CloudCheck, Eraser, X, UploadCloud, Link as LinkIcon
} from 'lucide-react';

interface Props {
    articleId: string;
    worldId: string;
    onBack: () => void;
}

export default function ArticleEditor({ articleId, worldId, onBack }: Props) {
    const [isInsertOpen, setIsInsertOpen] = useState(false);

    // State quản lý Modal Hình Ảnh
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
    const [imageUrl, setImageUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State quản lý Modal Chèn Link 
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [previousUrl, setPreviousUrl] = useState('');
    const [linkSelection, setLinkSelection] = useState<{ from: number, to: number } | null>(null);

    // State Lưới Tạo Bảng
    const [hoveredCell, setHoveredCell] = useState({ r: -1, c: -1 });

    const [title, setTitle] = useState('Đang tải dữ liệu...');
    // STATE CHO MỤC LỤC (TOC)
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [tocItems, setTocItems] = useState<{ text: string, level: number, pos: number }[]>([]);

    const generateToc = () => {
        if (!editor) return;
        const headings: { text: string, level: number, pos: number }[] = [];
        // Quét toàn bộ nội dung Editor để tìm thẻ Heading
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
                headings.push({ text: node.textContent, level: node.attrs.level, pos });
            }
        });
        setTocItems(headings);
        setIsTocOpen(!isTocOpen);
    };

    const scrollToHeading = (pos: number) => {
        if (!editor) return;
        editor.commands.setTextSelection(pos);
        editor.commands.scrollIntoView();
        setIsTocOpen(false);
    };
    // TRẠNG THÁI LƯU BÀI VIẾT
    const [isSaving, setIsSaving] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
            CustomImage,
            CustomInfoBox.configure({ worldId }),
            CustomLatex,
            CustomTable,
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            createCustomMention(worldId),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
        },
    });

    // LẤY DỮ LIỆU TỪ DATABASE
    useEffect(() => {
        const fetchArticleData = async () => {
            try {
                const res = await fetch(`http://localhost:5213/api/Articles/${articleId}`);
                if (res.ok) {
                    const data = await res.json();
                    setTitle(data.title);
                    if (editor && data.content) {
                        editor.commands.setContent(data.content);
                    }
                } else {
                    setTitle('Lỗi: Không tìm thấy bài viết');
                }
            } catch (error) {
                console.error("Lỗi khi kéo dữ liệu bài viết:", error);
                setTitle('Lỗi kết nối Server');
            }
        };

        if (articleId && editor) {
            fetchArticleData();
        }
    }, [articleId, editor]);

    // HÀM LƯU BÀI VIẾT
    const handleSave = async () => {
        if (!editor) return;
        setIsSaving(true);

        try {
            const htmlContent = editor.getHTML(); // Rút trích HTML từ Tiptap

            const response = await fetch(`http://localhost:5213/api/Articles/${articleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: articleId,
                    title: title,
                    content: htmlContent
                })
            });

            if (response.ok) {
                alert('Lưu bài viết thành công!');
            } else {
                alert('Lỗi khi lưu bài viết!');
            }
        } catch (error) {
            console.error('Lỗi kết nối khi lưu:', error);
            alert('Không thể kết nối đến Server C#!');
        } finally {
            setIsSaving(false);
        }
    };

    // HÀM CHÈN LINK
    const openLinkModal = () => {
        if (!editor) return;
        const prevUrl = editor.getAttributes('link').href || '';
        const { from, to } = editor.state.selection;

        setPreviousUrl(prevUrl);
        setLinkUrl(prevUrl);
        setLinkSelection({ from, to });
        setIsLinkModalOpen(true);
    };

    const handleInsertLink = () => {
        if (!editor || !linkSelection) return;
        editor.chain().focus().setTextSelection({ from: linkSelection.from, to: linkSelection.to }).run();

        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else if (linkSelection.from === linkSelection.to && !previousUrl) {
            editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank">${linkUrl}</a>`).run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl, target: '_blank' }).run();
        }

        setIsLinkModalOpen(false);
        setLinkUrl('');
        setPreviousUrl('');
        setLinkSelection(null);
    };

    // HÀM CHÈN & UPLOAD ẢNH THẬT
    const handleInsertImage = async () => {
        if (imageTab === 'url' && imageUrl) {
            editor?.chain().focus().insertContent({ type: 'customImage', attrs: { src: imageUrl } }).run();
            setIsImageModalOpen(false);
            setImageUrl('');
        }
        else if (imageTab === 'upload' && fileInputRef.current?.files?.[0]) {
            const file = fileInputRef.current.files[0];
            const formData = new FormData();
            formData.append('ImageFile', file); // Gửi file xuống Backend

            try {
                // API Upload Ảnh xuống C#
                const res = await fetch(`http://localhost:5213/api/Articles/upload-image`, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    const realUrl = `http://localhost:5213${data.url}`; // Lấy URL thật Server trả về
                    editor?.chain().focus().insertContent({ type: 'customImage', attrs: { src: realUrl } }).run();
                } else {
                    alert('Lỗi tải ảnh lên Server!');
                }
            } catch (error) {
                console.error("Lỗi Upload:", error);
                alert('Không thể kết nối đến Backend C#!');
            }

            setIsImageModalOpen(false);
            setImageUrl('');
        }
    };

    if (!editor) return null;

    return (
        <div className="w-full flex flex-col h-full bg-white relative overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100 bg-white z-10 shrink-0 px-8">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={onBack} className="p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="text-xl font-black text-gray-800 border-none outline-none bg-transparent placeholder-gray-300 focus:ring-0 flex-1 min-w-0 truncate max-w-sm" 
                        placeholder="Tên bài viết..." 
                        title={title}
                    />

                    {/* NÚT MỤC LỤC (TOC) */}
                    <div className="relative">
                        <button 
                            onClick={generateToc}
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 ${isTocOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                            title="Mục lục bài viết"
                        >
                            <ListTree size={18} />
                        </button>

                        {/* DROPDOWN MỤC LỤC */}
                        {isTocOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 shadow-2xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm">Mục lục</h4>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar px-2">
                                    {tocItems.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-400">Chưa có tiêu đề nào.</div>
                                    ) : (
                                        tocItems.map((item, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => scrollToHeading(item.pos)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 rounded-lg text-sm text-gray-600 hover:text-blue-700 transition-colors truncate"
                                                style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px`, fontWeight: item.level === 1 ? 'bold' : 'normal' }}
                                            >
                                                {item.text || 'Tiêu đề trống'}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 pl-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                        <CloudCheck size={14} /> Tự động lưu ngầm...
                    </div>
                    {/* NÚT LƯU THỦ CÔNG */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-5 py-2 font-bold text-sm rounded-xl shadow-sm transition-colors whitespace-nowrap ${isSaving ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thủ công'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 px-12 custom-scrollbar">
                <div className="max-w-5xl w-full mx-auto mt-8">
                    <div className="flex items-start gap-8 relative z-0">
                        <div className="flex-1 min-w-0 prose prose-blue max-w-none text-gray-800 font-normal leading-relaxed min-h-[500px] prose-hr:border-t-[3px] prose-hr:border-gray-400 prose-hr:rounded-full prose-hr:my-8 [&_.tiptap-custom-table]:not-prose [&_table]:w-full">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>
            </div>

            {/* THANH CÔNG CỤ VIÊN THUỐC */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center bg-gray-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-2xl border border-gray-800 gap-3">
                <div className="flex items-center gap-1">
                    <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-gray-800"><Undo2 size={16} /></button>
                    <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-gray-800"><Redo2 size={16} /></button>
                </div>
                <div className="w-px h-5 bg-gray-800"></div>
                <div className="flex items-center gap-1">
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-lg ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Bold size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-lg ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Italic size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded-lg ${editor.isActive('strike') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Strikethrough size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded-lg ${editor.isActive('underline') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><UnderlineIcon size={16} /></button>
                    <div className="flex items-center ml-1 border-l border-gray-700 pl-2">
                        <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" />
                        <button onClick={() => editor.chain().focus().unsetColor().run()} className="p-1.5 ml-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800"><Eraser size={16} /></button>
                    </div>
                </div>
                <div className="w-px h-5 bg-gray-800"></div>
                <div className="flex items-center gap-1">
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded-lg ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Heading1 size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded-lg ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Heading2 size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded-lg ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Heading3 size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><AlignLeft size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><AlignCenter size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-lg ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><List size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-lg ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><ListOrdered size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded-lg ${editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Quote size={16} /></button>
                </div>
                <div className="w-px h-5 bg-gray-800"></div>
                <div className="flex items-center gap-1">
                    <button onClick={openLinkModal} className={`p-1.5 rounded-lg ${editor.isActive('link') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title="Chèn Liên Kết"><Link2 size={16} /></button>
                </div>
                <div className="w-px h-5 bg-gray-800"></div>

                {/* MENU CHÈN ĐA NĂNG */}
                <div className="flex items-center gap-2 relative">
                    <button onClick={() => setIsInsertOpen(!isInsertOpen)} className={`p-1.5 rounded-lg transition-all ${isInsertOpen ? 'bg-blue-600 text-white rotate-45' : 'bg-gray-800 text-blue-400 hover:bg-gray-700'}`}>
                        <Plus size={16} />
                    </button>

                    {isInsertOpen && (
                        <div className="absolute bottom-12 right-0 bg-gray-900 border border-gray-800 shadow-2xl rounded-xl py-1.5 w-64 z-50 flex flex-col animate-in fade-in zoom-in duration-100">

                            {/* LƯỚI TẠO BẢNG 8x8 */}
                            <div className="px-3 py-2 border-b border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400 font-bold">Chèn Bảng</span>
                                    <span className="text-xs text-blue-400 font-bold">{hoveredCell.r >= 0 ? `${hoveredCell.c + 1}x${hoveredCell.r + 1}` : ''}</span>
                                </div>
                                <div className="grid grid-cols-8 gap-0.5" onMouseLeave={() => setHoveredCell({ r: -1, c: -1 })}>
                                    {Array.from({ length: 8 }).map((_, r) => (
                                        Array.from({ length: 8 }).map((_, c) => (
                                            <div
                                                key={`${r}-${c}`}
                                                onMouseEnter={() => setHoveredCell({ r, c })}
                                                onClick={() => {
                                                    editor?.chain().focus().insertTable({ rows: r + 1, cols: c + 1, withHeaderRow: true }).run();
                                                    setIsInsertOpen(false);
                                                }}
                                                className={`w-full aspect-square border rounded-sm cursor-pointer transition-colors duration-75 ${r <= hoveredCell.r && c <= hoveredCell.c ? 'bg-blue-500/50 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                            />
                                        ))
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => { setIsInsertOpen(false); setIsImageModalOpen(true); }} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white text-left"><ImageIcon size={14} className="text-gray-500" /> Chèn Hình ảnh</button>
                            <button onClick={() => { editor?.chain().focus().insertContent({ type: 'customLatex' }).run(); setIsInsertOpen(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white text-left"><Sigma size={14} className="text-gray-500" /> Công thức Toán (LaTeX)</button>
                            <button onClick={() => { alert('Sẽ xổ danh sách Template hồ sơ dựng sẵn'); setIsInsertOpen(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white text-left"><Layout size={14} className="text-gray-500" /> Chèn Mẫu dựng sẵn</button>
                            <div className="h-px bg-gray-800 my-1"></div>
                            <button onClick={() => { editor.chain().focus().setHorizontalRule().run(); setIsInsertOpen(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white text-left"><Minus size={14} className="text-gray-500" /> Vạch ngăn cách</button>
                        </div>
                    )}

                    <button
                        onClick={() => editor.chain().focus().insertContent({ type: 'customInfoBox' }).run()}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                        title="Chèn Hộp thông tin (InfoBox)"
                    >
                        <LayoutTemplate size={16} />
                    </button>
                </div>
            </div>

            {/* MODAL CHÈN LINK */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="font-black text-gray-800 text-lg">Chèn liên kết</h3>
                            <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <LinkIcon size={16} className="text-gray-400" /> Nhập địa chỉ URL
                            </label>
                            <input
                                autoFocus
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://youtube.com..."
                                className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleInsertLink(); }}
                            />
                            <div className="flex justify-end mt-5 gap-2">
                                {previousUrl && (
                                    <button onClick={() => { setLinkUrl(''); handleInsertLink(); }} className="px-4 py-2 text-sm text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all">Gỡ Link</button>
                                )}
                                <button onClick={handleInsertLink} className="px-5 py-2 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHÈN ẢNH */}
            {isImageModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="font-black text-gray-800 text-lg">Thêm hình ảnh</h3>
                            <button onClick={() => setIsImageModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
                        </div>

                        <div className="p-2 flex gap-1 border-b border-gray-100 bg-gray-50">
                            <button onClick={() => setImageTab('upload')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${imageTab === 'upload' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>Tải lên từ máy</button>
                            <button onClick={() => setImageTab('url')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${imageTab === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>Dán URL</button>
                        </div>

                        <div className="p-6">
                            {imageTab === 'upload' ? (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="p-3 bg-white shadow-sm rounded-full mb-3 group-hover:scale-110 transition-transform"><UploadCloud size={24} className="text-blue-500" /></div>
                                        <p className="mb-1 text-sm text-gray-500 font-bold">Nhấn để chọn file ảnh</p>
                                        <p className="text-xs text-gray-400">Hỗ trợ JPG, PNG, GIF</p>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleInsertImage} />
                                </label>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><LinkIcon size={16} className="text-gray-400" /> Nhập liên kết ảnh</label>
                                    <input autoFocus type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" />
                                    <div className="flex justify-end mt-4">
                                        <button onClick={handleInsertImage} disabled={!imageUrl} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">Chèn ảnh</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
