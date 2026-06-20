import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { World } from '../../types/world';

interface Props {
    world: World;
    onDelete?: (id: string) => void;
}

export default function WorldCard({ world, onDelete }: Props) {
    const getImageUrl = (path?: string) => {
        if (!path) return 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop';
        if (path.startsWith('/images/')) return `http://localhost:5213${path}`;
        return path;
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault(); // Bắt buộc phải có cái này để thẻ Link không bị kích hoạt khi bấm nút Xóa
        e.stopPropagation(); // Ngăn sự kiện lan ra ngoài
        
        if (window.confirm(`Ông có chắc chắn muốn xóa thế giới "${world.name}" không? Hành động này không thể hoàn tác.`)) {
            onDelete?.(world.id);
        }
    };

    return (
        <Link 
            to={`/world/${world.id}`} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col h-72 group relative block"
        >
            {/* Nút Xóa (Mặc định ẩn, hover vào mới hiện cho đẹp) */}
            <button 
                onClick={handleDelete}
                className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                title="Xóa thế giới này"
            >
                <Trash2 size={18} />
            </button>

            <div className="h-40 w-full bg-gray-100 relative overflow-hidden">
                <img 
                    src={getImageUrl(world.imagePath)} 
                    alt={world.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{world.name}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {world.description || 'Chưa có mô tả nào cho thế giới này...'}
                </p>
            </div>
        </Link>
    );
}