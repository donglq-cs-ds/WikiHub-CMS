import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ArrowLeft } from 'lucide-react';

interface Template {
    id: string;
    title: string;
    description?: string;
    content: string;
}

interface Props {
    onBack: () => void;
    onEdit: (id: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function TemplateManager({ onBack, onEdit }: Props) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        fetch(`${API_URL}/api/Templates`)
            .then(res => res.json())
            .then(setTemplates)
            .catch(console.error);
    }, [refreshTrigger]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/Templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, description: newDesc, content: '' })
            });
            if (res.ok) {
                const created = await res.json();
                setNewTitle('');
                setNewDesc('');
                setIsModalOpen(false);
                onEdit(created.id); // tạo xong mở luôn editor để soạn nội dung
            } else {
                alert('Lỗi khi tạo Khuôn mẫu.');
            }
        } catch (err) {
            console.error(err);
            alert('Không thể kết nối Server.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa khuôn mẫu này? Hành động không thể hoàn tác.')) return;
        await fetch(`${API_URL}/api/Templates/${id}`, { method: 'DELETE' });
        setRefreshTrigger(p => p + 1);
    };

    return (
        <div className="w-full flex flex-col h-full bg-white">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-6">
                <button onClick={onBack} className="p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-black text-gray-800 flex-1">Quản lý Khuôn mẫu</h2>
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">{templates.length} khuôn mẫu</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-50/30 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center h-40 text-blue-500 group shadow-sm"
                >
                    <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <Plus size={22} className="text-blue-500" />
                    </div>
                    <span className="mt-3 font-bold text-sm">Tạo Khuôn mẫu Mới</span>
                </div>

                {templates.map(tpl => (
                    <div key={tpl.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-40">
                        <h4 className="font-bold text-gray-800 line-clamp-1">{tpl.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 flex-1">{tpl.description || 'Không có mô tả.'}</p>
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-50">
                            <button onClick={() => onEdit(tpl.id)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"><Edit3 size={15} /></button>
                            <button onClick={() => handleDelete(tpl.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={15} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                        <h3 className="text-xl font-black mb-5 text-gray-800">Tạo Khuôn mẫu Mới</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tên khuôn mẫu</label>
                                <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-blue-500" placeholder="Ví dụ: Mẫu Nhân vật" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                                <textarea rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-blue-500 resize-none" placeholder="Dùng cho loại bài viết nào..." />
                            </div>
                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700">Tạo & Soạn nội dung</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}