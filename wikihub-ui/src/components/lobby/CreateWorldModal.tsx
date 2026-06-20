import { useState, useRef } from 'react';
import { X, Upload, Link } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>; // Thêm prop này
}

export default function CreateWorldModal({ isOpen, onClose, onSubmit }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageType, setImageType] = useState<'file' | 'url'>('file');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('Name', name);
            if (description) formData.append('Description', description);
            
            if (imageType === 'file' && fileInputRef.current?.files?.[0]) {
                formData.append('ImageFile', fileInputRef.current.files[0]);
            } else if (imageType === 'url' && imageUrl) {
                formData.append('ImageUrl', imageUrl);
            }

            await onSubmit(formData);
            
            // Xóa trắng form khi tạo xong
            setName('');
            setDescription('');
            setImageUrl('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            onClose();
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tạo thế giới. Xem console để biết thêm chi tiết.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition-colors">
                    <X size={20} />
                </button>
                
                <h2 className="text-2xl font-black mb-6 text-gray-800">Tạo Thế Giới Mới</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tên thế giới <span className="text-red-500">*</span></label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-0 focus:border-blue-500 outline-none transition-colors" 
                            placeholder="Nhập tên thế giới..." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-0 focus:border-blue-500 outline-none transition-colors resize-none" 
                            placeholder="Vài nét về thế giới này..." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh bìa</label>
                        <div className="flex gap-4 mb-3">
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-colors ${imageType === 'file' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                                <input type="radio" className="hidden" checked={imageType === 'file'} onChange={() => setImageType('file')} />
                                <Upload size={16} /> Tải từ máy
                            </label>
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-colors ${imageType === 'url' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                                <input type="radio" className="hidden" checked={imageType === 'url'} onChange={() => setImageType('url')} />
                                <Link size={16} /> Dùng URL
                            </label>
                        </div>
                        
                        {imageType === 'file' ? (
                            <input type="file" accept="image/*" ref={fileInputRef}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
                        ) : (
                            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} 
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-0 focus:border-blue-500 outline-none transition-colors" 
                                placeholder="https://..." />
                        )}
                    </div>

                    <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 font-medium text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                            {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );}