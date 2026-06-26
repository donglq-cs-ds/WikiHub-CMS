import { useState, useEffect } from 'react';
import { Map, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { getMaps, createMap, deleteMap, updateMap, getImageUrl } from '../../../api/mapApi';
import type { MapSummary } from '../../../api/mapApi';

interface Props {
    worldId: string;
    activeMapId: string | null;
    onSelectMap: (mapId: string) => void;
}

export default function MapSidebar({ worldId, activeMapId, onSelectMap }: Props) {
    const [maps, setMaps] = useState<MapSummary[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    useEffect(() => {
        if (!worldId) return;
        getMaps(worldId).then(setMaps).catch(console.error);
    }, [worldId]);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        try {
            const created = await createMap(worldId, newTitle.trim());
            const newMap: MapSummary = {
                id: created.id,
                worldId,
                title: created.title,
                layerCount: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setMaps(prev => [...prev, newMap]);
            setNewTitle('');
            setIsCreating(false);
            onSelectMap(created.id);
        } catch (err) {
            console.error('Lỗi tạo map:', err);
        }
    };

    const handleRename = async (id: string) => {
        if (!editingTitle.trim()) return;
        try {
            await updateMap(id, editingTitle.trim());
            setMaps(prev => prev.map(m => m.id === id ? { ...m, title: editingTitle.trim() } : m));
            setEditingId(null);
        } catch (err) {
            console.error('Lỗi đổi tên map:', err);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`Xóa bản đồ "${title}"? Tất cả pin và layer sẽ bị xóa.`)) return;
        try {
            await deleteMap(id);
            setMaps(prev => prev.filter(m => m.id !== id));
            if (activeMapId === id) onSelectMap('');
        } catch (err) {
            console.error('Lỗi xóa map:', err);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            {/* Section header */}
            <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Map size={12} /> Bản đồ
                </span>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Thêm bản đồ mới"
                >
                    <Plus size={13} />
                </button>
            </div>

            {/* Create form inline */}
            {isCreating && (
                <div className="mx-2 mb-1 flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5">
                    <input
                        autoFocus
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleCreate();
                            if (e.key === 'Escape') { setIsCreating(false); setNewTitle(''); }
                        }}
                        className="flex-1 text-xs bg-transparent outline-none text-gray-800 placeholder-gray-400"
                        placeholder="Tên bản đồ..."
                    />
                    <button onClick={handleCreate} className="text-blue-600 hover:text-blue-800 p-0.5">
                        <Check size={13} />
                    </button>
                    <button onClick={() => { setIsCreating(false); setNewTitle(''); }}
                        className="text-gray-400 hover:text-gray-600 p-0.5">
                        <X size={13} />
                    </button>
                </div>
            )}

            {/* Map list */}
            {maps.map(map => (
                <div key={map.id} className={`group flex items-center gap-2 mx-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                    activeMapId === map.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                    {/* Thumbnail nhỏ */}
                    <div className="w-7 h-7 rounded bg-gray-200 overflow-hidden shrink-0 border border-gray-300">
                        {map.backgroundImagePath ? (
                            <img src={getImageUrl(map.backgroundImagePath)}
                                alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Map size={12} className="text-gray-400" />
                            </div>
                        )}
                    </div>

                    {editingId === map.id ? (
                        <input
                            autoFocus
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleRename(map.id);
                                if (e.key === 'Escape') setEditingId(null);
                                e.stopPropagation();
                            }}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 text-xs border border-blue-400 rounded px-1.5 py-0.5 outline-none bg-white min-w-0"
                        />
                    ) : (
                        <span
                            onClick={() => onSelectMap(map.id)}
                            className="flex-1 text-xs font-medium truncate min-w-0"
                        >
                            {map.title}
                        </span>
                    )}

                    {editingId === map.id ? (
                        <div className="flex gap-0.5 shrink-0">
                            <button onClick={() => handleRename(map.id)}
                                className="p-0.5 text-green-600 hover:bg-green-50 rounded">
                                <Check size={11} />
                            </button>
                            <button onClick={() => setEditingId(null)}
                                className="p-0.5 text-gray-400 hover:bg-gray-100 rounded">
                                <X size={11} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e => {
                                e.stopPropagation();
                                setEditingId(map.id);
                                setEditingTitle(map.title);
                            }} className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                <Edit2 size={11} />
                            </button>
                            <button onClick={e => {
                                e.stopPropagation();
                                handleDelete(map.id, map.title);
                            }} className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                <Trash2 size={11} />
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {maps.length === 0 && !isCreating && (
                <p className="text-xs text-gray-400 px-3 py-2 text-center">
                    Chưa có bản đồ nào.
                </p>
            )}
        </div>
    );
}