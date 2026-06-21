import { useState, useEffect } from 'react';
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
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { ArrowLeft, Pencil, ListTree } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;
interface Props {
    articleId: string;
    worldId: string;
    onBack: () => void;
    onEdit: () => void;
    onNavigate?: (articleId: string) => void;
}

export default function ArticleReader({ articleId, worldId, onBack, onEdit }: Props) {
    const [title, setTitle] = useState('Đang tải dữ liệu...');

    // STATE CHO MỤC LỤC (TOC)
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [tocItems, setTocItems] = useState<{ text: string, level: number, pos: number }[]>([]);

    const editor = useEditor({
        editable: false, // QUAN TRỌNG NHẤT: Khóa chết Editor, chỉ cho đọc
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            // openOnClick: true -> Cho phép click mở link ở chế độ đọc
            Link.configure({ openOnClick: true, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
            CustomImage,
            CustomInfoBox.configure({ worldId }),
            CustomLatex,
            CustomTable,
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            createCustomMention(worldId), // Vẫn phải truyền worldId để thẻ tag hiển thị đúng
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
        },
    });

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

    useEffect(() => {
        if (!articleId || !editor) return;

        fetch(`${API_URL}/api/Articles/${articleId}`)
            .then(res => {
                if (!res.ok) throw new Error('Không tìm thấy bài viết');
                return res.json();
            })
            .then(data => {
                setTitle(data.title);
                // Bơm nội dung vào Tiptap (chế độ chỉ đọc)
                // Nội dung được lưu dưới dạng chuỗi JSON của Tiptap (xem ArticleEditor.handleSave),
                // nên phải parse trước khi setContent, nếu không Tiptap sẽ coi đó là chuỗi HTML
                // và hiển thị nguyên văn JSON ra màn hình.
                if (data.content) {
                    try {
                        editor.commands.setContent(JSON.parse(data.content));
                    } catch {
                        // Phòng trường hợp dữ liệu cũ còn lưu dạng HTML thô
                        editor.commands.setContent(data.content);
                    }
                }
            })
            .catch(error => {
                console.error("Lỗi khi kéo dữ liệu bài viết:", error);
                setTitle('Lỗi: Không thể tải bài viết');
            });
    }, [articleId, editor]);

    // ========================================================================
    // 2. TỔNG HỢP: HOVER PREVIEW CHO CẢ MENTION VÀ LINK (WIKIPEDIA STYLE)
    // ========================================================================
    useEffect(() => {
        if (!editor) return;

        const container = editor.view.dom;
        let currentTip: any = null;

        const escapeHtml = (str: string) =>
            String(str).replace(/[&<>"']/g, (c) => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            } as Record<string, string>)[c]);

        const handleMouseOver = async (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('span[data-type="mention"], a[href]') as HTMLElement | null;
            if (!target) return;

            if (currentTip?._tippy?.reference === target) return;
            currentTip?._tippy?.destroy();

            const href = target.getAttribute('href');
            const mentionId = target.getAttribute('data-id');
            const articleId = mentionId || (href?.includes('/articles/') ? href.split('/articles/')[1] : null);

            // TRƯỜNG HỢP 1: Mention hoặc link trỏ tới bài viết nội bộ -> preview từ DB của mình
            if (articleId) {
                const tip = tippy(target, {
                    placement: 'top', interactive: true, allowHTML: true, delay: [300, 100], theme: 'light-border',
                    content: '<div style="padding:8px; font-size:12px; color:#9ca3af;">Đang tải...</div>',
                    onShow: async (instance) => {
                        try {
                            const res = await fetch(`${API_URL}/api/Articles/${articleId}`);
                            if (!res.ok) throw new Error('Not found');
                            const article = await res.json();

                            const parser = new DOMParser();
                            const doc = parser.parseFromString(article.content || '', 'text/html');
                            let moTaSnippet = article.description || 'Chưa có mô tả ngắn.';
                            const h2Tags = Array.from(doc.querySelectorAll('h2'));
                            const moTaH2 = h2Tags.find(h => h.textContent?.toLowerCase().includes('mô tả'));
                            if (moTaH2 && moTaH2.nextElementSibling?.tagName === 'P') {
                                const fullText = moTaH2.nextElementSibling.textContent || '';
                                moTaSnippet = fullText.length > 150 ? fullText.substring(0, 150) + '...' : fullText;
                            }

                            const imageUrl = article.imagePath
                                ? `${API_URL}${article.imagePath}`
                                : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100&auto=format&fit=crop';

                            instance.setContent(`
                        <div style="display:flex; flex-direction:column; gap:10px; padding:6px; width:256px; font-family:sans-serif;">
                            <div style="display:flex; align-items:flex-start; gap:12px;">
                                <img src="${imageUrl}" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1px solid #e5e7eb; flex-shrink:0;" />
                                <div style="flex:1; min-width:0; padding-top:2px;">
                                    <div style="font-weight:700; font-size:14px; color:#111827; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(article.title)}</div>
                                    <div style="font-size:10px; color:#2563eb; font-weight:600; margin-top:4px; background:#eff6ff; display:inline-block; padding:2px 8px; border-radius:4px;">${escapeHtml(article.type)}</div>
                                </div>
                            </div>
                            <div style="font-size:12px; color:#4b5563; line-height:1.6; border-top:1px solid #f3f4f6; padding-top:10px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
                                ${escapeHtml(moTaSnippet)}
                            </div>
                        </div>
                    `);
                        } catch {
                            instance.setContent('<div style="font-size:12px; color:#ef4444; padding:8px; font-weight:600;">Không tìm thấy bài viết!</div>');
                        }
                    },
                });
                currentTip = target;
                (tip as any).show();
                return;
            }

            // TRƯỜNG HỢP 2: Link ngoài (http/https bất kỳ) -> preview kiểu Open Graph qua BE proxy
            if (href && /^https?:\/\//i.test(href)) {
                const tip = tippy(target, {
                    placement: 'top', interactive: true, allowHTML: true, delay: [300, 100], theme: 'light-border',
                    content: '<div style="padding:8px; font-size:12px; color:#9ca3af;">Đang tải...</div>',
                    onShow: async (instance) => {
                        try {
                            const res = await fetch(`${API_URL}/api/LinkPreview?url=${encodeURIComponent(href)}`);
                            if (!res.ok) throw new Error('Not found');
                            const data = await res.json();

                            instance.setContent(`
                        <div style="display:flex; flex-direction:column; gap:8px; padding:6px; width:256px; font-family:sans-serif;">
                            ${data.image ? `<img src="${escapeHtml(data.image)}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; border:1px solid #e5e7eb;" />` : ''}
                            <div>
                                <div style="font-weight:700; font-size:13px; color:#111827; line-height:1.4;">${escapeHtml(data.title || href)}</div>
                                <div style="font-size:10px; color:#9ca3af; margin-top:2px;">${escapeHtml(data.siteName || '')}</div>
                            </div>
                            ${data.description ? `<div style="font-size:11px; color:#4b5563; line-height:1.5; border-top:1px solid #f3f4f6; padding-top:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(data.description)}</div>` : ''}
                        </div>
                    `);
                        } catch {
                            instance.setContent('<div style="font-size:12px; color:#9ca3af; padding:8px;">Không lấy được preview cho link này.</div>');
                        }
                    },
                });
                currentTip = target;
                (tip as any).show();
            }
        };

        container.addEventListener('mouseover', handleMouseOver);

        return () => {
            container.removeEventListener('mouseover', handleMouseOver);
        };
    }, [articleId, editor]);

    if (!editor) return null;

    return (
        <div className="w-full flex flex-col h-full bg-white relative overflow-hidden">

            {/* HEADER CHẾ ĐỘ ĐỌC */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100 bg-white z-10 shrink-0 px-8">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button onClick={onBack} className="p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    {/* NÚT MỤC LỤC (TOC) */}
                    <div className="relative shrink-0">
                        <button
                            onClick={generateToc}
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 ${isTocOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                            title="Mục lục bài viết"
                        >
                            <ListTree size={18} />
                        </button>

                        {/* DROPDOWN MỤC LỤC */}
                        {isTocOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 shadow-2xl rounded-xl py-2 z-[60] animate-in fade-in slide-in-from-top-2">
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
                    {/* Tên bài viết ở dạng text bình thường, không gõ được nữa */}
                    <h1 className="text-xl font-black text-gray-800 min-w-0 truncate max-w-sm" title={title}>
                        {title}
                    </h1>

                </div>

                <div className="flex items-center gap-4 pl-4">
                    {/* NÚT CHUYỂN SANG CHẾ ĐỘ EDIT */}
                    <button onClick={onEdit} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap">
                        <Pencil size={16} /> Chỉnh sửa
                    </button>
                </div>
            </div>

            {/* VÙNG NỘI DUNG CHỈ ĐỌC */}
            <div className="flex-1 overflow-y-auto pb-32 px-12 custom-scrollbar">
                <div className="max-w-5xl w-full mx-auto mt-8">
                    <div className="flex items-start gap-8 relative z-0">
                        <div className="flex-1 min-w-0 prose prose-blue max-w-none text-gray-800 font-normal leading-relaxed min-h-[500px] prose-hr:border-t-[3px] prose-hr:border-gray-400 prose-hr:rounded-full prose-hr:my-8 [&_.tiptap-custom-table]:not-prose [&_table]:w-full">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Đã xóa sạch Thanh công cụ viên thuốc màu đen ở đây */}
        </div>
    );
}