import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { CATEGORIES } from '../../constants/entityTypes';
import { createArticle } from '../../api/articleApi';
import type { Article } from '../../api/articleApi';

interface Props {
    isOpen: boolean;
    worldId: string;
    initialTitle: string;
    onCancel: () => void;
    onCreated: (article: Article) => void;
}

export default function QuickCreateMentionModal({ isOpen, worldId, initialTitle, onCancel, onCreated }: Props) {
    const [title, setTitle] = useState(initialTitle);
    const [type, setType] = useState(CATEGORIES[0]?.types[0] || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Mỗi lần mở modal, nạp lại tên từ @query và focus + bôi đen sẵn để gõ đè nếu cần
    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setIsSubmitting(false);
            setTimeout(() => titleInputRef.current?.select(), 50);
        }
    }, [isOpen, initialTitle]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!title.trim() || !worldId || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('Title', title.trim());
            formData.append('Type', type);
            formData.append('IsOverview', 'false');

            const created = await createArticle(worldId, formData);
            onCreated(created);
        } catch (error) {
            console.error('[QuickCreate] Lỗi tạo bài viết:', error);
            alert('Không thể tạo bài viết mới. Xem console để biết chi tiết.');
            setIsSubmitting(false);
        }
    };

    // Chặn mousedown/keydown lan ra ngoài để không đụng vào plugin Suggestion của editor phía sau
    const stop = (e: React.SyntheticEvent) => e.stopPropagation();

    // Render qua Portal thẳng vào document.body — bắt buộc, vì modal này được
    // gọi từ bên trong popup của Tippy (Tippy dùng transform để định vị popup,
    // mà có transform trên ancestor thì position:fixed sẽ bị "nhốt" theo
    // ancestor đó thay vì full màn hình). Portal giúp thoát khỏi cái bẫy CSS này.
    return createPortal(
        <div
            onMouseDown={stop}
            onKeyDown={stop}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        >
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-150">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-black text-gray-800 text-base">Tạo nhanh bài viết</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">Tên bài viết</label>
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => { stop(e); if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); } }}
                            className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                            placeholder="Tên bài viết..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">Phân loại</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 transition-colors bg-white"
                        >
                            {CATEGORIES.map(cat => (
                                <optgroup key={cat.id} label={cat.title}>
                                    {cat.types.map(t => <option key={t} value={t}>{t}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting || !title.trim()}
                            className="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                            <Check size={15} /> {isSubmitting ? 'Đang tạo...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}