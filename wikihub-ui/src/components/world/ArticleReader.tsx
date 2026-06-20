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
    useEffect(() => {
        const fetchArticleData = async () => {
            try {
                const res = await fetch(`http://localhost:5213/api/Articles/${articleId}`);
                if (res.ok) {
                    const data = await res.json();
                    setTitle(data.title);

                    // Nạp nội dung bài viết vào Editor
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