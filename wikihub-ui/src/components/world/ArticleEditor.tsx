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
    Sigma, Layout, Minus, CloudCheck, Eraser, X, UploadCloud, Link as LinkIcon, ListTree, Search
} from 'lucide-react';

interface Props {
    articleId: string;
    worldId: string;
    onBack: () => void;
    isTemplate?: boolean;
}

export default function ArticleEditor({ articleId, worldId, onBack, isTemplate = false }: Props) {
    const API_URL = import.meta.env.VITE_API_URL; // Dùng biến môi trường
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
    const [description, setDescription] = useState(''); // chỉ dùng khi isTemplate

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

    // TRẠNG THÁI QUẢN LÝ TEMPLATE (chèn mẫu có sẵn vào bài đang soạn)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const [dbTemplates, setDbTemplates] = useState<any[]>([]);

    // Template không thuộc world nào nên không cho @mention trỏ vào bài viết của 1 world cụ thể
    const mentionWorldId = isTemplate ? '' : worldId;

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
            CustomImage,
            CustomInfoBox.configure({ worldId: mentionWorldId }),
            CustomLatex,
            CustomTable,
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            createCustomMention(mentionWorldId),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
        },
    });

    // LẤY DỮ LIỆU TỪ DATABASE (Article hoặc Template tùy isTemplate)
    useEffect(() => {
        const fetchArticleData = async () => {
            try {
                const url = isTemplate
                    ? `${API_URL}/api/Templates/${articleId}`
                    : `${API_URL}/api/Articles/${articleId}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setTitle(data.title);
                    if (isTemplate) setDescription(data.description || '');
                    if (editor && data.content) {
                        try {
                            editor.commands.setContent(JSON.parse(data.content));
                        } catch {
                            editor.commands.setContent(data.content);
                        }
                    }
                } else {
                    setTitle(isTemplate ? 'Lỗi: Không tìm thấy khuôn mẫu' : 'Lỗi: Không tìm thấy bài viết');
                }
            } catch (error) {
                console.error("Lỗi khi kéo dữ liệu:", error);
                setTitle('Lỗi kết nối Server');
            }
        };

        if (articleId && editor) {
            fetchArticleData();
        }
    }, [articleId, editor]);

    // HÀM LƯU (Article hoặc Template tùy isTemplate)
    const handleSave = async () => {
        if (!editor) return;
        setIsSaving(true);
        try {
            const jsonContent = editor.getJSON();
            const url = isTemplate
                ? `${API_URL}/api/Templates/${articleId}`
                : `${API_URL}/api/Articles/${articleId}`;
            const body = isTemplate
                ? { id: articleId, title, description, content: JSON.stringify(jsonContent) }
                : { id: articleId, title, content: JSON.stringify(jsonContent) };

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                console.log('Lưu thành công!');
            } else {
                alert('Lỗi khi lưu!');
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
            formData.append('ImageFile', file);

            try {
                const res = await fetch(`${API_URL}/api/Articles/upload-image`, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    const realUrl = `${API_URL}${data.url}`;
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

    // KHI MỞ MODAL CHÈN MẪU -> KÉO DANH SÁCH TEMPLATE TỪ BẢNG TEMPLATES VỀ (toàn hệ thống, không lọc world)
    useEffect(() => {
        if (isTemplateModalOpen) {
            fetch(`${API_URL}/api/Templates`)
                .then(res => res.json())
                .then(data => setDbTemplates(data))
                .catch(err => console.error("Lỗi tải Template:", err));
        }
    }, [isTemplateModalOpen]);

    // AUTO-SAVE NGẦM (DEBOUNCE 2 GIÂY)
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            clearTimeout(window.autoSaveTimer);
            window.autoSaveTimer = setTimeout(() => {
                handleSave();
            }, 2000);
        };

        editor.on('update', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
            clearTimeout(window.autoSaveTimer);
        };
    }, [editor, title, description]);

    if (!editor) return null;

    return (
        <div className="w-full flex flex-col h-full bg-white relative overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100 bg-white z-10 shrink-0 px-8">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={onBack} className="p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <ArrowLeft size={20} />
                    </button>

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

                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-black text-gray-800 border-none outline-none bg-transparent placeholder-gray-300 focus:ring-0 flex-1 min-w-0 truncate max-w-sm"
                    placeholder="Tên bài viết..."
                    title={title}
                />

                {isTemplate && (
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-sm text-gray-500 border-none outline-none bg-transparent placeholder-gray-300 focus:ring-0 flex-1 min-w-0 truncate max-w-xs"
                        placeholder="Mô tả ngắn cho khuôn mẫu..."
                    />
                )}



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
                            <button onClick={() => { setIsTemplateModalOpen(true); setIsInsertOpen(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white text-left"><Layout size={14} className="text-gray-500" /> Chèn Mẫu dựng sẵn</button>
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

            {/* MODAL CHÈN TEMPLATE (TỪ DATABASE) */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                <LayoutTemplate className="text-blue-600" /> Chọn Khuôn Mẫu
                            </h3>
                            <button onClick={() => setIsTemplateModalOpen(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30">
                            {/* THANH TÌM KIẾM TEMPLATE */}
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm tên khuôn mẫu..."
                                    value={templateSearch}
                                    onChange={e => setTemplateSearch(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                />
                            </div>

                            {/* DANH SÁCH TEMPLATE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {dbTemplates
                                    .filter(t => t.title.toLowerCase().includes(templateSearch.toLowerCase()))
                                    .map(tpl => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => {
                                                if (!editor) return;

                                                try {
                                                    const contentObject = JSON.parse(tpl.content);
                                                    editor.commands.setContent(contentObject);
                                                } catch (e) {
                                                    editor.commands.setContent(tpl.content || '');
                                                }
                                                setIsTemplateModalOpen(false);
                                            }}
                                            className="bg-white border border-gray-200 p-4 rounded-xl text-left hover:border-blue-500 hover:shadow-md transition-all group flex flex-col gap-1.5"
                                        >
                                            <span className="font-bold text-gray-800 group-hover:text-blue-600 text-sm truncate">{tpl.title}</span>
                                            <span className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                                                {tpl.description || 'Khuôn mẫu động tạo từ Database'}
                                            </span>
                                        </button>
                                    ))}

                                {dbTemplates.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-gray-400 text-sm font-medium">
                                        Chưa có Template nào. Hãy bấm Bánh Răng để tạo!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}