import { useState } from 'react';
import { Layers, Eye, EyeOff, Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import type { MapLayerDto } from '../../../api/mapApi';

interface Props {
    layers: MapLayerDto[];
    visibleLayerIds: Set<string>;
    activeLayerId: string | null;
    onToggleLayer: (layerId: string) => void;
    onSelectLayer: (layerId: string) => void;
    onCreateLayer: () => void;
    onRenameLayer: (layerId: string, name: string) => void;
    onDeleteLayer: (layerId: string) => void;
}

export default function LayerPanel({
    layers,
    visibleLayerIds,
    activeLayerId,
    onToggleLayer,
    onSelectLayer,
    onCreateLayer,
    onRenameLayer,
    onDeleteLayer,
}: Props) {
    const [isOpen, setIsOpen] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const startEdit = (layer: MapLayerDto) => {
        setEditingId(layer.id);
        setEditingName(layer.name);
    };

    const confirmEdit = () => {
        if (editingId && editingName.trim()) {
            onRenameLayer(editingId, editingName.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="absolute top-4 right-4 z-20 select-none">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold shadow-lg transition-all ${
                    isOpen
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
            >
                <Layers size={16} />
                Layers
                {!isOpen && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                        {layers.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Layers ({layers.length})
                        </span>
                        <button
                            onClick={onCreateLayer}
                            className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Thêm layer mới"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto custom-scrollbar py-1">
                        {[...layers].sort((a, b) => b.order - a.order).map(layer => (
                            <div
                                key={layer.id}
                                onClick={() => onSelectLayer(layer.id)}
                                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
                                    activeLayerId === layer.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                            >
                                <GripVertical size={13} className="text-gray-300 shrink-0" />

                                <button
                                    onClick={e => { e.stopPropagation(); onToggleLayer(layer.id); }}
                                    className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    {visibleLayerIds.has(layer.id)
                                        ? <Eye size={14} />
                                        : <EyeOff size={14} className="text-gray-300" />
                                    }
                                </button>

                                {editingId === layer.id ? (
                                    <input
                                        autoFocus
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') confirmEdit();
                                            if (e.key === 'Escape') setEditingId(null);
                                            e.stopPropagation();
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        className="flex-1 text-xs border border-blue-400 rounded px-1.5 py-0.5 outline-none min-w-0"
                                    />
                                ) : (
                                    <span className={`flex-1 text-xs truncate ${
                                        activeLayerId === layer.id ? 'text-blue-700 font-bold' : 'text-gray-700'
                                    } ${!visibleLayerIds.has(layer.id) ? 'opacity-40' : ''}`}>
                                        {layer.name}
                                    </span>
                                )}

                                {layer.pins.length > 0 && editingId !== layer.id && (
                                    <span className="text-[10px] text-gray-400 shrink-0">{layer.pins.length}</span>
                                )}

                                {editingId === layer.id ? (
                                    <div className="flex gap-0.5 shrink-0">
                                        <button onClick={e => { e.stopPropagation(); confirmEdit(); }}
                                            className="p-0.5 text-green-600 hover:bg-green-50 rounded">
                                            <Check size={12} />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setEditingId(null); }}
                                            className="p-0.5 text-gray-400 hover:bg-gray-100 rounded">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={e => { e.stopPropagation(); startEdit(layer); }}
                                            className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit2 size={12} />
                                        </button>
                                        {layers.length > 1 && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Xóa layer "${layer.name}"? Các pin trong layer này sẽ bị xóa.`))
                                                        onDeleteLayer(layer.id);
                                                }}
                                                className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}