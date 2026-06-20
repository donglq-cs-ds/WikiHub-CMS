import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';

// ==========================================
// 1. GIAO DIỆN BẢNG GỢI Ý (MENTION LIST UI)
// ==========================================
export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1 min-w-[200px] overflow-hidden z-50">
      {props.items.length > 0 ? (
        props.items.map((item: any, index: number) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${index === selectedIndex ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            {item.label}
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-sm text-gray-400">Không tìm thấy bài viết...</div>
      )}
    </div>
  );
});
MentionList.displayName = 'MentionList';

// ==========================================
// 2. LÕI TIPTAP MENTION (NỐI API THẬT)
// ==========================================
// Bọc thành 1 function để nhận worldId từ bên ngoài truyền vào
export const createCustomMention = (worldId: string) => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-semibold cursor-pointer border border-blue-100 hover:bg-blue-100 transition-colors',
    },
    suggestion: {
      items: async ({ query }) => {
        if (!worldId) return []; // An toàn: Không có worldId thì không gọi

        try {
          const response = await fetch(`http://localhost:5213/api/Articles/search?q=${encodeURIComponent(query)}&worldId=${worldId}`);
          if (!response.ok) throw new Error('API Lỗi!');

          const data = await response.json();

          // Frontend mapping: Đổi 'title' từ DB thành 'label' cho UI hiển thị[cite: 9]
          return data.map((item: any) => ({
            id: item.id,
            label: item.title
          }));

        } catch (error) {
          console.error("[Mention] Lỗi fetch data:", error);
          return [];
        }
      },
      render: () => {
        let component: any;
        let popup: any;

        return {
          onStart: props => {
            component = new ReactRenderer(MentionList, { props, editor: props.editor });
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
            component.updateProps(props);
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