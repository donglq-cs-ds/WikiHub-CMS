import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trash2, Edit3, Check, Sigma } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css'; // Bắt buộc phải có để công thức hiển thị đẹp

const LatexComponent = ({ node, updateAttributes, deleteNode, selected }: any) => {
    const { latex } = node.attrs;
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(latex);
    const previewRef = useRef<HTMLDivElement>(null);

    // Thuật toán Render LaTeX ra màn hình
    useEffect(() => {
        if (previewRef.current) {
            try {
                katex.render(latex || '\\text{Nhập công thức Toán học...}', previewRef.current, {
                    displayMode: true, // Render dạng block to ở giữa
                    throwOnError: false, // Không sập web nếu gõ sai code
                    errorColor: '#ef4444' // Gõ sai thì bôi đỏ chữ
                });
            } catch (err) {
                previewRef.current.innerText = 'Lỗi cú pháp LaTeX!';
            }
        }
    }, [latex]);

    const handleSave = () => {
        updateAttributes({ latex: inputValue });
        setIsEditing(false);
    };

    const stopEvent = (e: any) => e.stopPropagation();

    return (
        <NodeViewWrapper className={`relative my-6 group flex flex-col items-center ${selected ? 'ring-2 ring-blue-500/20 rounded-xl bg-blue-50/30' : ''}`}>

            {/* THANH CÔNG CỤ NỔI (Khi click vào block toán) */}
            {selected && !isEditing && (
                <div className="absolute -top-12 bg-gray-900 text-white flex items-center gap-1 rounded-xl p-1 z-50 shadow-xl animate-in zoom-in fade-in duration-200">
                    <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-blue-600 rounded-lg flex items-center gap-1.5 px-2">
                        <Edit3 size={16} /> <span className="text-xs font-bold">Sửa Công thức</span>
                    </button>
                    <div className="w-px h-5 bg-gray-700 mx-1"></div>
                    <button onClick={deleteNode} className="p-1.5 hover:bg-red-500 rounded-lg text-gray-300 hover:text-white"><Trash2 size={16} /></button>
                </div>
            )}

            {/* MÀN HÌNH HIỂN THỊ CÔNG THỨC */}
            <div
                ref={previewRef}
                onClick={() => { if(selected) setIsEditing(true); }}
                className={`px-8 w-full text-center cursor-pointer transition-colors ${isEditing ? 'opacity-30' : 'hover:bg-gray-50 rounded-xl'}`}
            />

            {/* HỘP THOẠI NHẬP MÃ LATEX (Nổi lên khi bấm Sửa) */}
            {isEditing && (
                <div
                    onMouseDown={stopEvent} // Ngăn cướp nháy chuột của Tiptap
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[400px] bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 z-50 animate-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-center gap-2 mb-3 text-gray-800 font-black text-sm">
                        <Sigma size={16} className="text-blue-600"/> Nhập mã LaTeX
                    </div>
                    <textarea
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            stopEvent(e);
                            // Bấm Enter để Lưu (Shift+Enter để xuống dòng trong code)
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSave();
                            }
                        }}
                        rows={3}
                        placeholder="Ví dụ: E = mc^2 hoặc c = \pm\sqrt{a^2 + b^2}"
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-mono text-sm outline-none focus:border-blue-500 focus:bg-white resize-none transition-colors"
                    />
                    <div className="flex justify-between items-center mt-3">
                        <a href="https://katex.org/docs/supported.html" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-semibold">Xem bảng mã hỗ trợ</a>
                        <div className="flex gap-2">
                            <button onClick={() => { setInputValue(latex); setIsEditing(false); }} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                            <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors"><Check size={14}/> Xong</button>
                        </div>
                    </div>
                </div>
            )}
        </NodeViewWrapper>
    );
};

export const CustomLatex = Node.create({
    name: 'customLatex',
    group: 'block',
    atom: true,
    draggable: true,
    addAttributes() {
        return {
            latex: { default: 'f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi' }, // Công thức mặc định ngầu ngầu
        };
    },
    parseHTML() { return [{ tag: 'div[data-type="latex"]' }]; },
    renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'latex' })]; },
    addNodeView() { return ReactNodeViewRenderer(LatexComponent); }
});