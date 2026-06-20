import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trash2, X, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { MiniMentionField } from './Minimentionfield';

// JSONContent rỗng dùng làm giá trị mặc định cho 1 field mới
const emptyDoc = (text?: string) => ({
    type: 'doc',
    content: [{
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
    }],
});

// Lấy text thuần từ 1 node JSONContent 
const docToPlainText = (doc: any): string => {
    if (!doc || !doc.content) return '';
    let out = '';
    const walk = (node: any) => {
        if (node.type === 'text') out += node.text || '';
        if (node.type === 'mention') out += `@${node.attrs?.label ?? ''}`;
        if (node.content) node.content.forEach(walk);
    };
    doc.content.forEach(walk);
    return out;
};

const InfoBoxComponent = ({ node, updateAttributes, deleteNode, extension }: any) => {
    const { title } = node.attrs;
    const metadata = Array.isArray(node.attrs.metadata) ? node.attrs.metadata : [];
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const worldId: string = extension.options.worldId;

    const addField = () =>
        updateAttributes({ metadata: [...metadata, { key: emptyDoc('Thuộc tính'), value: emptyDoc('Giá trị') }] });

    const removeField = (index: number) =>
        updateAttributes({ metadata: metadata.filter((_: any, i: number) => i !== index) });

    const updateField = (index: number, keyOrValue: 'key' | 'value', json: any) => {
        const newMeta = metadata.map((field: any, i: number) =>
            i === index ? { ...field, [keyOrValue]: json } : field
        );
        updateAttributes({ metadata: newMeta });
    };

    const stopEvent = (e: React.KeyboardEvent | React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleFileForField = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // --- CÁCH MỚI: UPLOAD LÊN SERVER ---
            const formData = new FormData();
            formData.append('ImageFile', file);

            const res = await fetch('http://localhost:5213/api/Articles/upload-image', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const realUrl = `http://localhost:5213${data.url}`;

                // Cập nhật URL thật vào InfoBox
                updateField(idx, 'value', emptyDoc(realUrl));
            } else {
                alert('Lỗi khi tải ảnh lên server!');
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert('Lỗi kết nối đến Backend C#');
        }
    };

    const handleDrop = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverIdx(null);
        handleFileForField(idx, e.dataTransfer.files?.[0]);
    };
    const isImageValue = (v: string) => /^(https?:\/\/|data:|blob:)/.test(v || '');

    return (
        <NodeViewWrapper
            as="aside"
            draggable="true"
            data-drag-handle
            style={{
                float: 'right',
                margin: '0 0 1rem 1.5rem',
                width: '320px',
                clear: 'right',
            }}
            className="border border-[#a2a9b1] bg-[#f8f9fa] p-3 text-sm shadow-sm relative group cursor-grab active:cursor-grabbing outline-none focus:outline-none"
        >
            <button onClick={deleteNode} contentEditable={false} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10">
                <X size={14} />
            </button>

            <input
                type="text"
                value={title || ''}
                onChange={(e) => updateAttributes({ title: e.target.value })}
                onKeyDownCapture={stopEvent}
                onMouseDownCapture={stopEvent}
                className="w-full text-center font-bold text-[1.1rem] bg-transparent border-none outline-none mb-3 text-gray-900"
                placeholder="Nhập tiêu đề hộp..."
            />

            <div className="flex flex-col border-t border-[#a2a9b1]">
                {metadata.map((field: any, idx: number) => {
                    const keyText = docToPlainText(field.key).toLowerCase();
                    const valueText = docToPlainText(field.value);
                    const isImgField = keyText === 'img' || keyText === 'image';

                    return (
                        <div key={idx} className="flex border-b border-[#a2a9b1] relative group/row bg-white hover:bg-gray-50 transition-colors">
                            {isImgField ? (
                                <div className="w-full flex flex-col p-2">
                                    <div className="flex justify-between items-start mb-2 border-b border-dashed border-gray-200 pb-2">
                                        <div className="flex-1 min-w-0">
                                            <MiniMentionField
                                                worldId={worldId}
                                                content={field.key}
                                                onChange={(json) => updateField(idx, 'key', json)}
                                                className="bg-transparent font-bold text-xs text-blue-600 outline-none w-full [&_p]:m-0"
                                            />
                                        </div>
                                        <button onClick={() => removeField(idx)} contentEditable={false} className="text-gray-400 hover:text-red-500 bg-white rounded shrink-0 ml-2"><Trash2 size={14} /></button>
                                    </div>

                                    {valueText && isImageValue(valueText) ? (
                                        <div className="relative group/image" contentEditable={false}>
                                            <img src={valueText} className="w-full h-auto rounded-lg border border-gray-300" alt="infobox image" />
                                            <button
                                                onClick={() => updateField(idx, 'value', emptyDoc())}
                                                className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow opacity-0 group-hover/image:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <label
                                                contentEditable={false}
                                                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                                                onDragLeave={() => setDragOverIdx(null)}
                                                onDrop={handleDrop(idx)}
                                                className={`flex flex-col items-center justify-center w-full py-5 px-2 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${dragOverIdx === idx ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                                                    }`}
                                            >
                                                <UploadCloud size={20} className="text-blue-500 mb-1.5" />
                                                <p className="text-xs text-gray-600">
                                                    Kéo ảnh vào đây hoặc <span className="text-blue-600 font-semibold underline">nhấn chọn</span>
                                                </p>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onClick={stopEvent}
                                                    onChange={(e) => handleFileForField(idx, e.target.files?.[0])}
                                                />
                                            </label>

                                            <div className="flex items-center gap-2 my-2" contentEditable={false}>
                                                <div className="flex-1 h-px bg-gray-200" />
                                                <span className="text-[10px] text-gray-400">hoặc</span>
                                                <div className="flex-1 h-px bg-gray-200" />
                                            </div>

                                            <input
                                                placeholder="Dán link ảnh vào đây..."
                                                className="w-full bg-gray-50 p-2 text-xs outline-none border border-gray-300 rounded-lg focus:border-blue-400"
                                                value={isImageValue(valueText) ? valueText : ''}
                                                onChange={(e) => updateField(idx, 'value', emptyDoc(e.target.value))}
                                                onKeyDownCapture={stopEvent}
                                                onMouseDownCapture={stopEvent}
                                            />
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* FIX: Đóng khung cứng tỷ lệ 40% cho Cột Trái */}
                                    <div className="w-[40%] shrink-0 border-r border-[#a2a9b1]">
                                        <MiniMentionField
                                            worldId={worldId}
                                            content={field.key}
                                            onChange={(json) => updateField(idx, 'key', json)}
                                            className="w-full h-full bg-transparent font-bold p-2.5 outline-none focus:bg-blue-50 text-gray-800 [&_p]:m-0"
                                        />
                                    </div>

                                    {/* FIX: Đóng khung cứng tỷ lệ 60% cho Cột Phải */}
                                    <div className="w-[60%] min-w-0">
                                        <MiniMentionField
                                            worldId={worldId}
                                            content={field.value}
                                            onChange={(json) => updateField(idx, 'value', json)}
                                            className="w-full h-full bg-transparent p-2.5 outline-none focus:bg-blue-50 text-gray-700 [&_p]:m-0"
                                        />
                                    </div>

                                    <button onClick={() => removeField(idx)} contentEditable={false} className="absolute right-1 top-2 text-gray-400 hover:text-red-500 opacity-0 group-hover/row:opacity-100 bg-white rounded shadow-sm border border-gray-200 p-0.5"><Trash2 size={13} /></button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <button onClick={addField} contentEditable={false} className="w-full mt-3 text-blue-600 hover:underline text-xs font-semibold text-center py-1">+ Thêm trường thông tin</button>
        </NodeViewWrapper>
    );
};

export const CustomInfoBox = Node.create({
    name: 'customInfoBox',
    group: 'block',
    atom: true,
    draggable: true,
    addOptions() {
        return { worldId: '' };
    },
    addAttributes() {
        return {
            title: {
                default: 'Tổng quan',
                parseHTML: el => el.getAttribute('data-title') || 'Tổng quan',
                renderHTML: attrs => ({ 'data-title': attrs.title })
            },
            metadata: {
                default: [{
                    key: emptyDoc('Chủng tộc'),
                    value: emptyDoc('Con người'),
                }],
                parseHTML: el => {
                    try {
                        const parsed = JSON.parse(el.getAttribute('data-metadata') || '[]');
                        return Array.isArray(parsed) ? parsed : [];
                    } catch { return []; }
                },
                renderHTML: attrs => ({ 'data-metadata': JSON.stringify(attrs.metadata || []) }),
            },
        };
    },
    parseHTML() { return [{ tag: 'aside[data-type="infobox"]' }]; },
    renderHTML({ HTMLAttributes }) { return ['aside', mergeAttributes(HTMLAttributes, { 'data-type': 'infobox' })]; },
    addNodeView() { return ReactNodeViewRenderer(InfoBoxComponent); }
});