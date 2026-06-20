import { mergeAttributes } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Move, Rows, Columns, Combine, Split, Trash2, LayoutPanelTop, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── CSS: override prose + style bảng ────────────────────────────────────────
const TABLE_STYLE = `
/* Neutralize Tailwind prose can thiệp vào bảng */
.ProseMirror .tiptap-custom-table,
.ProseMirror .tiptap-custom-table *,
.prose .tiptap-custom-table,
.prose .tiptap-custom-table * {
    all: revert;
}

/* Rồi set lại đúng style mình muốn */
.tiptap-custom-table {
    display: block;
    overflow-x: auto;
}
.tiptap-custom-table table {
    width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
    margin: 0 !important;
    min-width: 0 !important;
    max-width: 100% !important;
    font-size: 15px !important;
}
.tiptap-custom-table td,
.tiptap-custom-table th {
    border: 1px solid #d1d5db !important;
    padding: 5px 8px !important;
    min-width: 40px !important;
    vertical-align: top !important;
    color: #1f2937 !important;
    word-break: break-word !important;
    white-space: normal !important;
}
.tiptap-custom-table th {
    background: #f9fafb !important;
    font-weight: 600 !important;
    text-align: left !important;
}
.tiptap-custom-table td p,
.tiptap-custom-table th p {
    margin: 0 !important;
    padding: 0 !important;
}
/* Ô được chọn */
.tiptap-custom-table .selectedCell {
    background: #dbeafe !important;
    outline: 2px solid #3b82f6 !important;
    outline-offset: -2px !important;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('tiptap-custom-table-style')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'tiptap-custom-table-style';
    styleEl.textContent = TABLE_STYLE;
    document.head.appendChild(styleEl);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
type Alignment = 'left' | 'center' | 'right';

const getWrapperStyle = (alignment: Alignment, width: number | string): React.CSSProperties => {
    const w = alignment === 'center'
        ? '100%'
        : typeof width === 'number' ? `${width}px` : width;

    if (alignment === 'left') return {
        float: 'left', margin: '0 1.5rem 1rem 0',
        clear: 'none', display: 'block',
        width: w, maxWidth: '100%', position: 'relative',
    };
    if (alignment === 'right') return {
        float: 'right', margin: '0 0 1rem 1.5rem',
        clear: 'none', display: 'block',
        width: w, maxWidth: '100%', position: 'relative',
    };
    return {
        float: 'none', margin: '1.5rem 0',
        clear: 'both', display: 'block',
        width: '100%', maxWidth: '100%', position: 'relative',
    };
};

// ─── NODE VIEW ────────────────────────────────────────────────────────────────
const TableNodeComponent = ({ node, updateAttributes, deleteNode, selected, editor, getPos }: any) => {
    const { width, alignment } = node.attrs;
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isTableActive, setIsTableActive] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const update = () => {
            const { from, to } = editor.state.selection;
            const pos = getPos();
            if (typeof pos === 'number') setIsTableActive(from >= pos && to <= pos + node.nodeSize);
        };
        editor.on('selectionUpdate', update);
        return () => editor.off('selectionUpdate', update);
    }, [editor, getPos, node.nodeSize]);

    useEffect(() => {
        const close = () => setContextMenu({ show: false, x: 0, y: 0 });
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, []);

    const showUI = selected || isTableActive || contextMenu.show;

    // ── RESIZE ────────────────────────────────────────────────────────────────
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = containerRef.current?.offsetWidth ?? (typeof width === 'number' ? width : 600);
        setIsResizing(true);
        const onMove = (mv: MouseEvent) => {
            updateAttributes({ width: Math.max(120, Math.min(startWidth + (mv.clientX - startX), 1400)) });
        };
        const onUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [width, updateAttributes]);

    // ── DRAG để đổi alignment ─────────────────────────────────────────────────
    const handleDragEnd = useCallback((e: React.DragEvent) => {
        setIsDragging(false);
        const proseEl = containerRef.current?.closest('.ProseMirror') as HTMLElement | null;
        const rect = proseEl?.getBoundingClientRect();
        const left = rect?.left ?? 0;
        const w = rect?.width ?? window.innerWidth;
        const pct = (e.clientX - left) / w;
        const halfWidth = Math.round((rect?.width ?? 600) * 0.5);

        if (pct < 0.35) updateAttributes({ alignment: 'left', width: typeof width === 'number' && width < (rect?.width ?? 9999) * 0.6 ? width : halfWidth });
        else if (pct > 0.65) updateAttributes({ alignment: 'right', width: typeof width === 'number' && width < (rect?.width ?? 9999) * 0.6 ? width : halfWidth });
        else updateAttributes({ alignment: 'center', width: '100%' });
    }, [width, updateAttributes]);

    // ── Đổi alignment từ toolbar ──────────────────────────────────────────────
    const setAlignment = useCallback((a: Alignment) => {
        if (a === 'center') {
            updateAttributes({ alignment: 'center', width: '100%' });
        } else {
            const proseEl = containerRef.current?.closest('.ProseMirror') as HTMLElement | null;
            const editorWidth = proseEl?.offsetWidth ?? 600;
            const newWidth = typeof width === 'number' && width < editorWidth * 0.6 ? width : Math.round(editorWidth * 0.5);
            updateAttributes({ alignment: a, width: newWidth });
        }
    }, [width, updateAttributes]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setContextMenu({ show: true, x: e.clientX, y: e.clientY });
    };
    const runCommand = (action: () => void) => { action(); setContextMenu({ show: false, x: 0, y: 0 }); };

    const wrapperStyle = getWrapperStyle(alignment || 'center', width);

    const menuItems: Array<null | { icon: React.ReactNode; label: string; action: () => void; danger?: boolean; bold?: boolean }> = [
        { icon: <AlignLeft size={13} />, label: 'Float trái (wrap text)', action: () => setAlignment('left') },
        { icon: <AlignCenter size={13} />, label: 'Full width (giữa)', action: () => setAlignment('center') },
        { icon: <AlignRight size={13} />, label: 'Float phải (wrap text)', action: () => setAlignment('right') },
        null,
        { icon: <Rows size={13} />, label: 'Thêm dòng trên', action: () => editor.chain().focus().addRowBefore().run() },
        { icon: <Rows size={13} />, label: 'Thêm dòng dưới', action: () => editor.chain().focus().addRowAfter().run() },
        null,
        { icon: <Columns size={13} />, label: 'Thêm cột trái', action: () => editor.chain().focus().addColumnBefore().run() },
        { icon: <Columns size={13} />, label: 'Thêm cột phải', action: () => editor.chain().focus().addColumnAfter().run() },
        null,
        { icon: <Combine size={13} />, label: 'Gộp ô', action: () => editor.chain().focus().mergeCells().run() },
        { icon: <Split size={13} />, label: 'Tách ô', action: () => editor.chain().focus().splitCell().run() },
        null,
        { icon: <LayoutPanelTop size={13} />, label: 'Bật/tắt hàng tiêu đề', action: () => editor.chain().focus().toggleHeaderRow().run() },
        null,
        { icon: <Trash2 size={13} />, label: 'Xóa dòng', action: () => editor.chain().focus().deleteRow().run(), danger: true },
        { icon: <Trash2 size={13} />, label: 'Xóa cột', action: () => editor.chain().focus().deleteColumn().run(), danger: true },
        { icon: <Trash2 size={13} />, label: 'XÓA BẢNG', action: deleteNode, danger: true, bold: true },
    ];

    return (
        <NodeViewWrapper
            as="div"
            draggable={!isResizing}
            data-drag-handle
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={wrapperStyle}
        >
            {/* TOOLBAR MINI */}
            {showUI && !isDragging && (
                <div contentEditable={false} style={{
                    position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                    background: '#111827', borderRadius: 10, padding: '3px 4px',
                    display: 'flex', alignItems: 'center', gap: 2,
                    zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
                }}>
                    {([
                        { a: 'left' as Alignment, icon: <AlignLeft size={14} />, title: 'Float trái' },
                        { a: 'center' as Alignment, icon: <AlignCenter size={14} />, title: 'Full width' },
                        { a: 'right' as Alignment, icon: <AlignRight size={14} />, title: 'Float phải' },
                    ]).map(({ a, icon, title }) => (
                        <button key={a} onClick={() => setAlignment(a)} title={title} style={{
                            padding: '4px 7px', borderRadius: 7, border: 'none', cursor: 'pointer',
                            background: alignment === a ? '#3b82f6' : 'transparent',
                            color: alignment === a ? 'white' : '#9ca3af',
                            display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                        }}>{icon}</button>
                    ))}
                    <div style={{ width: 1, height: 18, background: '#374151', margin: '0 3px' }} />
                    <button onClick={deleteNode} title="Xóa bảng" style={{
                        padding: '4px 7px', borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: '#9ca3af', display: 'flex', alignItems: 'center',
                    }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ef4444'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
                    ><Trash2 size={14} /></button>
                </div>
            )}

            {/* NÚT DRAG */}
            {showUI && (
                <div contentEditable={false} title="Kéo để di chuyển / đổi alignment" style={{
                    position: 'absolute', top: -12, left: -12, width: 22, height: 22,
                    background: 'white', border: '1px solid #9ca3af', borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'grab', zIndex: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                    pointerEvents: 'none',
                }}>
                    <Move size={13} color="#374151" />
                </div>
            )}

            {/* BẢNG */}
            <div
                ref={containerRef}
                className="tiptap-custom-table"
                onContextMenu={handleContextMenu}
                style={{ width: '100%', overflowX: 'auto' }}
            >
                <NodeViewContent as="table" />
            </div>

            {/* NÚT RESIZE */}
            {showUI && (
                <div contentEditable={false} onMouseDown={handleResizeStart} title="Kéo để resize" style={{
                    position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                    width: 11, height: 36, background: 'white', border: '1px solid #6b7280',
                    borderRadius: 4, cursor: 'ew-resize', zIndex: 20,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#9ca3af' }} />)}
                </div>
            )}

            {isResizing && <div style={{ position: 'fixed', inset: 0, zIndex: 50, cursor: 'ew-resize' }} />}

            {/* CONTEXT MENU */}
            {contextMenu.show && (
                <div contentEditable={false} onMouseDown={e => e.stopPropagation()} style={{
                    position: 'fixed', top: contextMenu.y, left: contextMenu.x,
                    zIndex: 9999, background: 'white', border: '1px solid #e5e7eb',
                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    padding: '6px 0', minWidth: 210, display: 'flex', flexDirection: 'column',
                }}>
                    {menuItems.map((item, i) =>
                        item === null ? (
                            <div key={i} style={{ height: 1, background: '#f3f4f6', margin: '3px 0' }} />
                        ) : (
                            <button key={i} onClick={() => runCommand(item.action)}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.background = item.bold ? '#dc2626' : item.danger ? '#fef2f2' : '#f3f4f6';
                                    if (item.bold) el.style.color = 'white';
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.background = 'none';
                                    el.style.color = item.danger ? '#dc2626' : '#374151';
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '7px 14px', background: 'none', border: 'none',
                                    cursor: 'pointer', textAlign: 'left', width: '100%',
                                    color: item.danger ? '#dc2626' : '#374151',
                                    fontWeight: item.bold ? 700 : 400, fontSize: 13,
                                }}
                            >{item.icon}{item.label}</button>
                        )
                    )}
                </div>
            )}
        </NodeViewWrapper>
    );
};

// ─── EXTENSION ────────────────────────────────────────────────────────────────
export const CustomTable = Table.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '100%',
                parseHTML: el => el.getAttribute('data-width') || '100%',
                renderHTML: attrs => ({ 'data-width': String(attrs.width) }),
            },
            alignment: {
                default: 'center',
                parseHTML: el => el.getAttribute('data-alignment') || 'center',
                renderHTML: attrs => ({ 'data-alignment': attrs.alignment }),
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(TableNodeComponent);
    },
});