import { useState } from 'react';
import { LayoutGrid, Table as TableIcon, ArrowDownAZ, CalendarDays, Clock, Eye, Edit3, Trash2, Plus } from 'lucide-react';
import type { Article } from '../../api/articleApi';

interface Props {
    typeName: string;
    articles: Article[];
    activeSort: string;
    onSortChange: (sort: string) => void;
    onDelete: (id: string) => void;
    onCreateClick: () => void;
    onRead: (id: string) => void;
    onEdit: (id: string) => void;
}

export default function ArticleManager({ typeName, articles, activeSort, onSortChange, onDelete, onCreateClick, onRead, onEdit }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const getImageUrl = (path?: string) => {
        if (!path) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop';
        if (path.startsWith('/images/')) return `http://localhost:5213${path}`;
        return path;
    };

    return (
        <div className="w-full flex flex-col h-full bg-white">
            {/* THANH CÔNG CỤ HOÁN ĐỔI */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-gray-800">{typeName}</h2>
                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                        {articles.length} bài viết
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Hiển thị dạng lưới"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Hiển thị dạng bảng"
                        >
                            <TableIcon size={18} />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-gray-200"></div>

                    <div className="flex gap-2">
                        <button onClick={() => onSortChange('Title')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSort === 'Title' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                            <ArrowDownAZ size={14} /> A-Z
                        </button>
                        <button onClick={() => onSortChange('CreatedAt')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSort === 'CreatedAt' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                            <CalendarDays size={14} /> Ngày tạo
                        </button>
                        <button onClick={() => onSortChange('UpdatedAt')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSort === 'UpdatedAt' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                            <Clock size={14} /> Ngày sửa
                        </button>
                    </div>
                </div>
            </div>

            {/* KHU VỰC HIỂN THỊ DANH SÁCH */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {viewMode === 'grid' ? (
                    /* DẠNG LƯỚI (GRID) */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* Ô CÒ SÚNG: Tạo Bài Viết Mới (Luôn ở đầu dạng lưới) */}
                        <div
                            onClick={onCreateClick}
                            className="bg-blue-50/30 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center h-64 text-blue-500 group shadow-sm shrink-0"
                        >
                            <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <Plus size={24} className="text-blue-500" />
                            </div>
                            <span className="mt-3 font-bold text-sm tracking-wide">Tạo {typeName} Mới</span>
                        </div>

                        {articles.map(art => (
                            <div key={art.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-64 group relative">
                                <div className="h-32 bg-gray-50 overflow-hidden relative shrink-0">
                                    <img src={getImageUrl(art.imagePath)} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-gray-800 line-clamp-1">{art.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{art.description || 'Không có mô tả.'}</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-50">
                                        <button onClick={() => onRead(art.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Xem bài viết"><Eye size={15} /></button>
                                        <button onClick={() => onEdit(art.id)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Chỉnh sửa bài viết"><Edit3 size={15} /></button>
                                        <button onClick={() => onDelete(art.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Xóa bài viết"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* DẠNG BẢNG (TABLE) */
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="p-3 w-20 text-center">Ảnh</th>
                                    <th className="p-3 w-1/4">Tiêu đề</th>
                                    <th className="p-3">Mô tả</th>
                                    <th className="p-3 w-28 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm">
                                {articles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-gray-400">
                                            Chưa có bài viết nào.
                                            <button onClick={onCreateClick} className="text-blue-600 font-bold ml-1 hover:underline">
                                                Bấm vào đây để tạo mới {typeName}
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    articles.map(art => (
                                        <tr key={art.id} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="p-3">
                                                <img src={getImageUrl(art.imagePath)} alt={art.title} className="w-12 h-12 object-cover rounded-md border border-gray-200 mx-auto" />
                                            </td>
                                            <td className="p-3 font-bold text-gray-800 truncate max-w-[200px]">{art.title}</td>
                                            <td className="p-3 text-gray-400 truncate max-w-[300px]">{art.description || '—'}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => onRead(art.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Eye size={15} /></button>
                                                    <button onClick={() => onEdit(art.id)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"><Edit3 size={15} /></button>
                                                    <button onClick={() => onDelete(art.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}