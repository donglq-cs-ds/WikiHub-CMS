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

import { ArrowLeft, Pencil } from 'lucide-react';

interface Props {
    articleId: string;
    worldId: string;
    onBack: () => void;
    onEdit: () => void; // <--- Prop mới để chuyển sang màn Edit
}

export default function ArticleReader({ articleId, worldId, onBack, onEdit }: Props) {
    const [title, setTitle] = useState('Đang tải dữ liệu...');

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

    // Kéo dữ liệu từ DB (Cả Title và Content)
    // ==========================================
    // HIỆU ỨNG HOVER XEM TRƯỚC BÀI VIẾT (WIKIPEDIA STYLE)
    // ==========================================
    // ========================================================================
    // TỔNG HỢP: HOVER PREVIEW CHO CẢ MENTION VÀ LINK (WIKIPEDIA STYLE)
    // ========================================================================
    useEffect(() => {
        if (!editor) return;

        const instance = tippy(editor.view.dom, {
            // Target: Gộp cả class "mention" và thẻ "a" (link)
            target: '.mention, a', 
            placement: 'top',
            interactive: true,
            allowHTML: true,
            delay: [300, 100],
            theme: 'light-border',
            content: '<div class="text-xs text-gray-400 p-2 font-semibold">Đang tải...</div>',
            
            onShow: async (tip) => {
                // 1. Xác định ID: Mention có data-id, Link có href (/articles/GUID)
                const href = tip.reference.getAttribute('href');
                const mentionId = tip.reference.getAttribute('data-id');
                
                // Trích xuất GUID từ href nếu không phải là mention
                const articleId = mentionId || (href?.includes('/articles/') ? href.split('/articles/')[1] : null);
                
                if (!articleId) {
                    // Nếu là link ngoài (không phải bài trong Wiki) thì không hiện preview
                    return false; 
                }

                try {
                    const res = await fetch(`http://localhost:5213/api/Articles/${articleId}`);
                    if (!res.ok) throw new Error('Not found');
                    const article = await res.json();

                    // 2. Thuật toán "Mổ xẻ" HTML để bóc tách đoạn Mô Tả
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(article.content || '', 'text/html');
                    
                    let moTaSnippet = article.description || 'Chưa có mô tả ngắn.';
                    
                    // Tìm thẻ H2 "Mô tả"
                    const h2Tags = Array.from(doc.querySelectorAll('h2'));
                    const moTaH2 = h2Tags.find(h => h.textContent?.toLowerCase().includes('mô tả'));
                    
                    if (moTaH2 && moTaH2.nextElementSibling?.tagName === 'P') {
                        const fullText = moTaH2.nextElementSibling.textContent || '';
                        moTaSnippet = fullText.length > 150 ? fullText.substring(0, 150) + '...' : fullText;
                    }

                    // 3. Render giao diện thẻ Tooltip (dùng chung cho cả link và mention)
                    const imageUrl = article.imagePath ? `http://localhost:5213${article.imagePath}` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100&auto=format&fit=crop';
                    
                    tip.setContent(`
                        <div class="flex flex-col gap-2.5 p-1.5 w-64 text-left font-sans bg-white shadow-xl">
                            <div class="flex items-start gap-3">
                                <img src="${imageUrl}" class="w-12 h-12 object-cover rounded-lg shrink-0 border border-gray-200" />
                                <div class="flex-1 min-w-0 pt-0.5">
                                    <div class="font-black text-[14px] text-gray-800 truncate leading-tight">${article.title}</div>
                                    <div class="text-[10px] text-blue-600 font-bold tracking-wider uppercase mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md">${article.type}</div>
                                </div>
                            </div>
                            <div class="text-[12px] text-gray-600 leading-relaxed border-t border-gray-100 pt-2.5 line-clamp-3">
                                ${moTaSnippet}
                            </div>
                        </div>
                    `);
                } catch (error) {
                    tip.setContent('<div class="text-xs text-red-500 p-2 font-bold">Không tìm thấy bài viết!</div>');
                }
            }
        });

        return () => instance.destroy();
    }, [articleId, editor]);

    if (!editor) return null;

    return (
        <div className="w-full flex flex-col h-full bg-white relative overflow-hidden">

            {/* HEADER CHẾ ĐỘ ĐỌC */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100 bg-white z-10 shrink-0 px-8">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={onBack} className="p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <ArrowLeft size={20} />
                    </button>

                    {/* Tên bài viết ở dạng text bình thường, không gõ được nữa */}
                    <h1 className="text-xl font-black text-gray-800 flex-1 min-w-0 truncate" title={title}>
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