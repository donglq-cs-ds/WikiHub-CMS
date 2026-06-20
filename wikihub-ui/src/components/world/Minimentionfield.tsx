import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { useEffect } from 'react';
import { createCustomMention } from './CustomMentionExtension';

// Document rút gọn: chỉ 1 dòng văn bản (không cho Enter xuống dòng)
const SingleLineDocument = Document.extend({ content: 'paragraph' });

interface MiniMentionFieldProps {
    worldId: string;
    content: any; // JSONContent của Tiptap (đã lưu trong node attrs)
    onChange: (json: any) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Editor Tiptap thu nhỏ, dùng để thay thế <input> trong các field
 * (title / key / value) của InfoBox, cho phép gõ @mention ngay trong field.
 *
 * Lý do cần cái này thay vì <input> thuần: Mention extension của Tiptap
 * chỉ hoạt động bên trong 1 ProseMirror editor instance thực sự — input
 * HTML thường không có suggestion plugin nên @ sẽ không bao giờ trigger.
 */
export const MiniMentionField = ({ worldId, content, onChange, placeholder, className }: MiniMentionFieldProps) => {
    const editor = useEditor({
        extensions: [
            SingleLineDocument,
            Paragraph,
            Text,
            createCustomMention(worldId),
        ],
        content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
        editorProps: {
            attributes: {
                class: `outline-none ${className || ''}`,
            },
            // Chặn Enter để field luôn là 1 dòng (giữ đúng hành vi input cũ)
            handleKeyDown: (_view, event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
        // Quan trọng: tránh lỗi SSR hydration mismatch trong Next.js
        immediatelyRender: false,
    });

    // Đồng bộ lại nếu content từ ngoài thay đổi (vd: undo/redo ở editor cha)
    useEffect(() => {
        if (!editor) return;
        const current = JSON.stringify(editor.getJSON());
        const incoming = JSON.stringify(content);
        if (current !== incoming) {
            editor.commands.setContent(content || { type: 'doc', content: [{ type: 'paragraph' }] }, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    return <EditorContent editor={editor} placeholder={placeholder} />;
};