import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trash2, Pencil, Check, X, UploadCloud, Link as LinkIcon } from 'lucide-react';
import { useState, useRef } from 'react';

// Lấy kích thước gốc của ảnh (để chèn/sửa ảnh đúng kích thước "nguyên bản")
const getNaturalWidth = (src: string, max = 700): Promise<number> => {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(Math.max(100, Math.min(img.naturalWidth, max)));
        img.onerror = () => resolve(400);
        img.src = src;
    });
};

const ImageNodeComponent = ({ node, updateAttributes, deleteNode, selected }: any) => {
    const { src, width, alignment } = node.attrs;
    const [isResizing, setIsResizing] = useState(false);

    // State quản lý Cửa sổ Sửa Ảnh (giờ giống hệt modal chèn ảnh, chỉ nhỏ hơn)
    const [isEditing, setIsEditing] = useState(false);
    const [editTab, setEditTab] = useState<'upload' | 'url'>('url');
    const [editUrl, setEditUrl] = useState(src);
    const [isDragOver, setIsDragOver] = useState(false);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Resize từ bất kỳ góc nào của viền (không chỉ góc dưới-phải như trước)
    const handleResizeStart = (corner: 'nw' | 'ne' | 'sw' | 'se') => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = containerRef.current?.offsetWidth || 0;
        // Góc bên trái: kéo sang trái mới là tăng kích thước
        const direction = corner === 'nw' || corner === 'sw' ? -1 : 1;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = (moveEvent.clientX - startX) * direction;
            const newWidth = startWidth + delta;
            updateAttributes({ width: Math.max(100, Math.min(newWidth, 1200)) });
        };

        const onMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Kéo ảnh qua lại để đổi căn lề, dính theo lề gần nhất - tính theo khung bài viết, không phải cả màn hình
    const handleDragEnd = (e: React.DragEvent) => {
        const proseEl = containerRef.current?.closest('.ProseMirror') as HTMLElement | null;
        const rect = proseEl?.getBoundingClientRect();
        const left = rect?.left ?? 0;
        const w = rect?.width ?? window.innerWidth;
        const percentX = (e.clientX - left) / w;

        if (percentX < 0.35) updateAttributes({ alignment: 'left' });
        else if (percentX > 0.65) updateAttributes({ alignment: 'right' });
        else updateAttributes({ alignment: 'center' });
    };

    const stopEvent = (e: React.KeyboardEvent | React.MouseEvent) => e.stopPropagation();

    const saveEdit = async () => {
        if (editTab === 'url' && editUrl) {
            const w = await getNaturalWidth(editUrl);
            updateAttributes({ src: editUrl, width: w });
        } else if (editTab === 'upload' && editFileInputRef.current?.files?.[0]) {
            const file = editFileInputRef.current.files[0];
            const objectUrl = URL.createObjectURL(file);
            const w = await getNaturalWidth(objectUrl);
            updateAttributes({ src: objectUrl, width: w });
        }
        setIsEditing(false);
    };

    const handleEditFileChange = () => {
        if (editFileInputRef.current?.files?.[0]) saveEdit();
    };

    const handleEditDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && editFileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            editFileInputRef.current.files = dt.files;
            saveEdit();
        }
    };

    const cornerHandle = (corner: 'nw' | 'ne' | 'sw' | 'se') => {
        const pos: Record<string, string> = {
            nw: '-top-1.5 -left-1.5 cursor-nwse-resize',
            ne: '-top-1.5 -right-1.5 cursor-nesw-resize',
            sw: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
            se: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
        };
        return (
            <div
                onMouseDown={handleResizeStart(corner)}
                className={`absolute ${pos[corner]} w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-md z-10`}
            />
        );
    };

    return (
        <NodeViewWrapper
            as="div"
            draggable={!isEditing && !isResizing}
            data-drag-handle=""
            contentEditable="false"
            onDragEnd={handleDragEnd}
            style={{
                float: alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'none',
                margin: alignment === 'left' ? '0 1.5rem 1rem 0' : alignment === 'right' ? '0 0 1rem 1.5rem' : '1rem auto',
                clear: alignment === 'center' ? 'both' : 'none',
                display: alignment === 'center' ? 'flex' : 'block',
                justifyContent: 'center',
                position: 'relative',
                width: 'fit-content',
                maxWidth: '100%',
                zIndex: selected ? 20 : 1
            }}
            className={`group outline-none focus:outline-none ${selected ? 'ring-4 ring-blue-500/50 rounded-lg' : ''}`}
        >
            {/* Thanh công cụ Mini: CHỈ còn Sửa ảnh + Xóa ảnh, bỏ nút căn lề */}
            {selected && !isEditing && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl shadow-xl flex items-center gap-1 p-1 z-50 animate-in fade-in zoom-in duration-200">
                    <button onClick={() => { setEditTab('url'); setEditUrl(src); setIsEditing(true); }} className="p-1.5 rounded-lg hover:bg-blue-600 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 px-2" title="Sửa ảnh">
                        <Pencil size={16} /> <span className="text-xs font-semibold">Sửa ảnh</span>
                    </button>
                    <div className="w-px h-5 bg-gray-700 mx-1"></div>
                    <button onClick={deleteNode} className="p-1.5 rounded-lg hover:bg-red-500 text-gray-300 hover:text-white transition-colors" title="Xóa ảnh"><Trash2 size={16} /></button>
                </div>
            )}

            {/* CỬA SỔ SỬA ẢNH: giống cửa sổ chèn ảnh nhưng nhỏ hơn, có Lưu/Hủy */}
            {isEditing && (
                <div
                    onMouseDown={stopEvent}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                >
                    <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100">
                        <h4 className="font-bold text-gray-800 text-sm">Sửa ảnh</h4>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={14} /></button>
                    </div>

                    <div className="p-1.5 flex gap-1 border-b border-gray-100 bg-gray-50">
                        <button onClick={() => setEditTab('upload')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${editTab === 'upload' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>Tải lên từ máy</button>
                        <button onClick={() => setEditTab('url')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${editTab === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>Dán URL</button>
                    </div>

                    <div className="p-3">
                        {editTab === 'upload' ? (
                            <label
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleEditDrop}
                                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragOver ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-blue-400'}`}
                            >
                                <UploadCloud size={20} className="text-blue-500 mb-1" />
                                <p className="text-xs text-gray-500 font-bold">Kéo thả hoặc nhấn để chọn ảnh</p>
                                <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={handleEditFileChange} onClick={stopEvent} />
                            </label>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><LinkIcon size={14} className="text-gray-400" /> Liên kết ảnh</label>
                                <input
                                    type="text"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    onKeyDown={stopEvent}
                                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                                    placeholder="https://example.com/anh.jpg"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end px-3 pb-3">
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
                        <button onClick={saveEdit} disabled={editTab === 'url' && !editUrl} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-1"><Check size={14} /> Lưu</button>
                    </div>
                </div>
            )}

            <div ref={containerRef} style={{ width: width }} className="relative">
                <img src={src} className="w-full h-auto rounded-lg shadow-sm border border-gray-200" alt="Custom Node" />

                {selected && !isEditing && (
                    <>
                        {cornerHandle('nw')}
                        {cornerHandle('ne')}
                        {cornerHandle('sw')}
                        {cornerHandle('se')}
                    </>
                )}
            </div>

            {isResizing && <div className="fixed inset-0 z-50 cursor-nwse-resize"></div>}
        </NodeViewWrapper>
    );
};

export const CustomImage = Node.create({
    name: 'customImage',
    group: 'block',
    atom: true,
    draggable: true,
    addAttributes() {
        return {
            src: { default: null },
            width: { default: 400 },
            alignment: { default: 'center' }
        };
    },
    parseHTML() {
        return [{
            tag: 'img[src]',
            getAttrs: (el: HTMLElement) => ({
                src: el.getAttribute('src'),
                width: el.style.width ? parseInt(el.style.width) : (el.getAttribute('data-width') ? parseInt(el.getAttribute('data-width')!) : 400),
                alignment: el.getAttribute('data-alignment') || 'center',
            }),
        }];
    },
    renderHTML({ HTMLAttributes }) {
        const { src, width, alignment } = HTMLAttributes;
        return ['img', mergeAttributes(HTMLAttributes, {
            src,
            'data-width': width,
            'data-alignment': alignment,
            style: `width: ${width}px; max-width: 100%;`,
        })];
    },
    addNodeView() { return ReactNodeViewRenderer(ImageNodeComponent); }
});
