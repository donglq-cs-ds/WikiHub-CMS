import Mention from '@tiptap/extension-mention';
import { mergeAttributes, ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import QuickCreateMentionModal from './QuickCreateMentionModal';
import type { Article } from '../../api/articleApi';
import { mergeAttributes } from '@tiptap/core';

// ==========================================
// 1. GIAO DIỆN BẢNG GỢI Ý (MENTION LIST UI)
// ==========================================
export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (!item) return;

    // Item ảo "Tạo mới" -> mở modal thay vì insert mention luôn
    if (item.isCreateNew) {
      setCreateTitle(item.label);
      setIsCreateModalOpen(true);
      return;
    }

    props.command({ id: item.id, label: item.label });
  };

  // Khi tạo bài viết mới thành công trong modal -> insert mention trỏ vào bài vừa tạo
  const handleCreated = (article: Article) => {
    setIsCreateModalOpen(false);
    props.command({ id: article.id, label: article.title });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      // Modal đang mở thì để phím gõ bình thường trong modal, không cướp phím nữa
      if (isCreateModalOpen) return false;

      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  useEffect(() => setSelectedIndex(0), [props.items]);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1 min-w-[220px] overflow-hidden z-50">
        {props.items.length > 0 ? (
          props.items.map((item: any, index: number) =>
            item.isCreateNew ? (
              <button
                key="__create_new__"
                onClick={() => selectItem(index)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 border-t border-gray-100 mt-1 ${index === selectedIndex ? 'bg-blue-50 text-blue-700 font-bold' : 'text-blue-600 hover:bg-blue-50'
                  }`}
              >
                <Plus size={14} /> Tạo mới: "{item.label}"
              </button>
            ) : (
              <button
                key={item.id}
                onClick={() => selectItem(index)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${index === selectedIndex ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {item.label}
              </button>
            )
          )
        ) : (
          <div className="px-4 py-2 text-sm text-gray-400">Không tìm thấy bài viết...</div>
        )}
      </div>

      <QuickCreateMentionModal
        isOpen={isCreateModalOpen}
        worldId={props.worldId}
        initialTitle={createTitle}
        onCancel={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
});
MentionList.displayName = 'MentionList';

// ==========================================
// 2. LÕI TIPTAP MENTION (NỐI API THẬT)
// ==========================================
// Bọc thành 1 function để nhận worldId từ bên ngoài truyền vào
export const createCustomMention = (worldId: string) => {
  return Mention.extend({
    renderHTML({ node, HTMLAttributes }) {
      const mergedAttrs = mergeAttributes(
        { class: 'text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-semibold cursor-pointer border border-blue-100 hover:bg-blue-100 transition-colors' },
        HTMLAttributes
      );
      return ['span', mergedAttrs, node.attrs.label ?? node.attrs.id ?? ''];
    },
    renderText({ node }) {
      return node.attrs.label ?? node.attrs.id ?? '';
    },
  }).configure({
    HTMLAttributes: {
      class: 'text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-semibold cursor-pointer border border-blue-100 hover:bg-blue-100 transition-colors',
    },
    suggestion: {
      items: async ({ query }) => {
        if (!worldId) return []; // An toàn: Không có worldId thì không gọi

        let results: any[] = [];
        try {
          const response = await fetch(`http://localhost:5213/api/Articles/search?q=${encodeURIComponent(query)}&worldId=${worldId}`);
          if (!response.ok) throw new Error('API Lỗi!');

          const data = await response.json();

          // Frontend mapping: Đổi 'title' từ DB thành 'label' cho UI hiển thị
          results = data.map((item: any) => ({
            id: item.id,
            label: item.title,
          }));
        } catch (error) {
          console.error("[Mention] Lỗi fetch data:", error);
        }

        // Luôn chèn thêm lựa chọn "Tạo mới" ở cuối nếu user đã gõ tên gì đó,
        // kể cả khi đã có vài kết quả khớp gần đúng — vì bài cần mention có
        // thể vẫn chưa tồn tại dù tên gần giống bài khác.
        if (query.trim()) {
          results.push({ id: '__create_new__', label: query.trim(), isCreateNew: true });
        }

        return results;
      },
      render: () => {
        let component: any;
        let popup: any;

        return {
          onStart: props => {
            component = new ReactRenderer(MentionList, { props: { ...props, worldId }, editor: props.editor });
            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as any,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            });
          },
          onUpdate(props) {
            component.updateProps({ ...props, worldId });
            popup[0].setProps({ getReferenceClientRect: props.clientRect });
          },
          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              popup[0].hide();
              return true;
            }
            return component.ref?.onKeyDown(props);
          },
          onExit() {
            popup[0].destroy();
            component.destroy();
          },
        };
      },
    },
  });
};