import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, MapPin as MapPinIcon, Trash2, Plus, Edit3, Image as ImageIcon } from 'lucide-react';
import type { WorldMapDto, MapPinDto, MapLayerDto } from '../../../api/mapApi';
import {
    getMap, uploadBackground, createPin, updatePin, deletePin,
    createLayer, updateLayer, deleteLayer, getImageUrl,
} from '../../../api/mapApi';
import LayerPanel from './LayerPanel';
import PinPopup from './PinPopup';

const API_URL = import.meta.env.VITE_API_URL;

interface Props {
    mapId: string;
    worldId: string;
    onNavigateArticle?: (articleId: string, type: string) => void;
}

type PopupState = {
    pin: MapPinDto;
    x: number;
    y: number;
    mode: 'hover' | 'edit';
} | null;

export default function WorldMapView({ mapId, worldId, onNavigateArticle }: Props) {
    const [mapData, setMapData] = useState<WorldMapDto | null>(null);
    const [loading, setLoading] = useState(true);

    // Layer state
    const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(new Set());
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

    // Pin placement mode
    const [isPlacingPin, setIsPlacingPin] = useState(false);

    // Popup state
    const [popup, setPopup] = useState<PopupState>(null);

    // Drag pin state
    const [draggingPinId, setDraggingPinId] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load map ───────────────────────────────────────────────────────────────
    const loadMap = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMap(mapId);
            setMapData(data);

            // Khởi tạo visible layers theo isVisibleByDefault
            const visible = new Set(
                data.layers.filter(l => l.isVisibleByDefault).map(l => l.id)
            );
            setVisibleLayerIds(visible);

            // Active layer = layer đầu tiên (order cao nhất = trên cùng)
            const sorted = [...data.layers].sort((a, b) => b.order - a.order);
            if (sorted.length > 0) setActiveLayerId(sorted[0].id);
        } catch (err) {
            console.error('Lỗi tải map:', err);
        } finally {
            setLoading(false);
        }
    }, [mapId]);

    useEffect(() => { loadMap(); }, [loadMap]);

    // ── Tất cả pin visible (flat list để render) ───────────────────────────────
    const visiblePins = mapData?.layers
        .filter(l => visibleLayerIds.has(l.id))
        .flatMap(l => l.pins.filter(p => p.layerIds.some(lid => visibleLayerIds.has(lid))))
        ?? [];

    // Tính tọa độ pixel từ % + kích thước container
    const toPixel = (x: number, y: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { px: 0, py: 0 };
        return { px: x * rect.width, py: y * rect.height };
    };

    // Tính % từ pixel click
    const toPercent = (clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
        };
    };

    // ── Click trên canvas: đặt pin mới ────────────────────────────────────────
    const handleCanvasClick = async (e: React.MouseEvent) => {
        if (!isPlacingPin || !activeLayerId || !mapData) return;
        if ((e.target as HTMLElement).closest('[data-pin]')) return;

        const { x, y } = toPercent(e.clientX, e.clientY);
        try {
            const newPin = await createPin(mapData.id, {
                layerIds: [activeLayerId],
                x, y,
                label: 'Pin mới',
                pinType: 'location',
                color: '#E24B4A',
            });

            // Cập nhật local state
            setMapData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    layers: prev.layers.map(l =>
                        l.id === activeLayerId
                            ? { ...l, pins: [...l.pins, newPin] }
                            : l
                    )
                };
            });

            // Mở edit popup ngay
            setPopup({ pin: newPin, x: e.clientX, y: e.clientY, mode: 'edit' });
            setIsPlacingPin(false);
        } catch (err) {
            console.error('Lỗi tạo pin:', err);
        }
    };

    // ── Upload ảnh nền ─────────────────────────────────────────────────────────
    const handleUploadBg = async (file: File) => {
        if (!mapData) return;
        try {
            const url = await uploadBackground(mapData.id, file);
            setMapData(prev => prev ? { ...prev, backgroundImagePath: url } : prev);
        } catch (err) {
            console.error('Lỗi upload ảnh nền:', err);
        }
    };

    // ── Save pin ───────────────────────────────────────────────────────────────
    const handleSavePin = async (pinId: string, data: Partial<MapPinDto>) => {
        if (!mapData) return;
        const pin = mapData.layers.flatMap(l => l.pins).find(p => p.id === pinId);
        if (!pin) return;

        const updated = { ...pin, ...data };
        try {
            await updatePin(mapData.id, pinId, {
                layerIds: updated.layerIds,
                articleId: updated.articleId,
                x: updated.x, y: updated.y,
                label: updated.label,
                pinType: updated.pinType,
                color: updated.color,
            });

            setMapData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    layers: prev.layers.map(l => ({
                        ...l,
                        pins: l.pins.map(p => p.id === pinId ? { ...p, ...data } : p)
                    }))
                };
            });
            setPopup(null);
        } catch (err) {
            console.error('Lỗi lưu pin:', err);
        }
    };

    // ── Delete pin ─────────────────────────────────────────────────────────────
    const handleDeletePin = async (pinId: string) => {
        if (!mapData) return;
        try {
            await deletePin(mapData.id, pinId);
            setMapData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    layers: prev.layers.map(l => ({
                        ...l,
                        pins: l.pins.filter(p => p.id !== pinId)
                    }))
                };
            });
            setPopup(null);
        } catch (err) {
            console.error('Lỗi xóa pin:', err);
        }
    };

    // ── Drag pin để di chuyển ─────────────────────────────────────────────────
    const handlePinDragEnd = async (e: React.DragEvent, pin: MapPinDto) => {
        const { x, y } = toPercent(e.clientX, e.clientY);
        if (x === 0 && y === 0) return;
        try {
            await updatePin(pin.mapId, pin.id, {
                layerIds: pin.layerIds, articleId: pin.articleId,
                x, y, label: pin.label, pinType: pin.pinType, color: pin.color,
            });
            setMapData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    layers: prev.layers.map(l => ({
                        ...l,
                        pins: l.pins.map(p => p.id === pin.id ? { ...p, x, y } : p)
                    }))
                };
            });
        } catch (err) {
            console.error('Lỗi di chuyển pin:', err);
        }
        setDraggingPinId(null);
    };

    // ── Layer operations ───────────────────────────────────────────────────────
    const handleCreateLayer = async () => {
        if (!mapData) return;
        const maxOrder = Math.max(...mapData.layers.map(l => l.order), -1);
        try {
            const newLayer = await createLayer(mapData.id, `Layer ${mapData.layers.length + 1}`, maxOrder + 1);
            setMapData(prev => prev ? { ...prev, layers: [...prev.layers, newLayer] } : prev);
            setVisibleLayerIds(prev => new Set([...prev, newLayer.id]));
            setActiveLayerId(newLayer.id);
        } catch (err) {
            console.error('Lỗi tạo layer:', err);
        }
    };

    const handleRenameLayer = async (layerId: string, name: string) => {
        if (!mapData) return;
        const layer = mapData.layers.find(l => l.id === layerId);
        if (!layer) return;
        try {
            await updateLayer(mapData.id, layerId, { name, order: layer.order, isVisibleByDefault: layer.isVisibleByDefault });
            setMapData(prev => prev ? {
                ...prev,
                layers: prev.layers.map(l => l.id === layerId ? { ...l, name } : l)
            } : prev);
        } catch (err) {
            console.error('Lỗi đổi tên layer:', err);
        }
    };

    const handleDeleteLayer = async (layerId: string) => {
        if (!mapData) return;
        try {
            await deleteLayer(mapData.id, layerId);
            setMapData(prev => prev ? {
                ...prev,
                layers: prev.layers.filter(l => l.id !== layerId)
            } : prev);
            setVisibleLayerIds(prev => { const s = new Set(prev); s.delete(layerId); return s; });
            if (activeLayerId === layerId) {
                const remaining = mapData.layers.filter(l => l.id !== layerId);
                setActiveLayerId(remaining[0]?.id ?? null);
            }
        } catch (err) {
            console.error('Lỗi xóa layer:', err);
        }
    };

    // ── PIN ICON theo loại ─────────────────────────────────────────────────────
    const getPinEmoji = (pinType: string) => {
        const map: Record<string, string> = {
            location: '📍', city: '🏙️', dungeon: '⚓',
            event: '⚡', character: '👤', custom: '🔖',
        };
        return map[pinType] ?? '📍';
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Đang tải bản đồ...</p>
            </div>
        </div>
    );

    if (!mapData) return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Không tải được bản đồ.
        </div>
    );

    const bgUrl = mapData.backgroundImagePath ? getImageUrl(mapData.backgroundImagePath) : null;

    return (
        <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#f0ece4]">

            {/* ── TOOLBAR TRÊN ─────────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 z-10">
                {/* Nút đặt pin */}
                <button
                    onClick={() => { setIsPlacingPin(!isPlacingPin); setPopup(null); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        isPlacingPin
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <MapPinIcon size={15} />
                    {isPlacingPin ? 'Đang đặt pin... (nhấn ESC để hủy)' : 'Đặt pin'}
                </button>

                <div className="h-4 w-px bg-gray-200" />

                {/* Upload ảnh nền */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                    <ImageIcon size={15} />
                    {bgUrl ? 'Đổi ảnh nền' : 'Thêm ảnh nền'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleUploadBg(e.target.files[0]); }} />

                {bgUrl && (
                    <button
                        onClick={() => setMapData(prev => prev ? { ...prev, backgroundImagePath: undefined } : prev)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={14} /> Xóa nền
                    </button>
                )}

                {/* Layer active indicator */}
                {activeLayerId && mapData.layers.find(l => l.id === activeLayerId) && (
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Layer đang chọn: <span className="font-bold text-gray-800">
                            {mapData.layers.find(l => l.id === activeLayerId)?.name}
                        </span>
                    </div>
                )}
            </div>

            {/* ── CANVAS ───────────────────────────────────────────────────── */}
            <div
                ref={containerRef}
                className={`relative flex-1 overflow-hidden ${
                    isPlacingPin ? 'cursor-crosshair' : 'cursor-default'
                }`}
                onClick={handleCanvasClick}
                onKeyDown={e => { if (e.key === 'Escape') setIsPlacingPin(false); }}
                tabIndex={0}
            >
                {/* Ảnh nền */}
                {bgUrl ? (
                    <img src={bgUrl} alt="Map background"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                        draggable={false} />
                ) : (
                    /* Placeholder khi chưa có ảnh nền */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
                        <div className="text-center opacity-30">
                            <ImageIcon size={48} className="mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-500 font-bold">Chưa có ảnh nền</p>
                            <p className="text-gray-400 text-sm mt-1">Nhấn "Thêm ảnh nền" để upload</p>
                        </div>
                        {/* Grid pattern */}
                        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>
                )}

                {/* ── PINS ────────────────────────────────────────────────── */}
                {visiblePins.map(pin => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    const px = rect ? pin.x * rect.width : 0;
                    const py = rect ? pin.y * rect.height : 0;
                    const isDragging = draggingPinId === pin.id;

                    return (
                        <div
                            key={pin.id}
                            data-pin="true"
                            draggable
                            onDragStart={e => {
                                setDraggingPinId(pin.id);
                                setPopup(null);
                                e.dataTransfer.setDragImage(new Image(), 0, 0);
                            }}
                            onDragEnd={e => handlePinDragEnd(e, pin)}
                            onClick={e => {
                                e.stopPropagation();
                                if (isPlacingPin) return;
                                setPopup({ pin, x: e.clientX, y: e.clientY, mode: 'hover' });
                            }}
                            style={{
                                position: 'absolute',
                                left: px,
                                top: py,
                                transform: 'translate(-50%, -100%)',
                                opacity: isDragging ? 0.4 : 1,
                                transition: isDragging ? 'none' : 'opacity 0.15s',
                                zIndex: popup?.pin.id === pin.id ? 15 : 10,
                            }}
                            className="cursor-pointer group select-none"
                        >
                            {/* Pin icon */}
                            <div className="relative flex flex-col items-center">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-base shadow-lg border-2 border-white group-hover:scale-110 transition-transform"
                                    style={{ background: pin.color }}
                                    title={pin.label}
                                >
                                    {getPinEmoji(pin.pinType)}
                                </div>
                                {/* Label */}
                                {pin.label && (
                                    <span className="mt-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-800 rounded shadow-sm whitespace-nowrap border border-gray-200 max-w-[120px] truncate">
                                        {pin.label}
                                    </span>
                                )}
                                {/* Dot dưới pin */}
                                <div className="w-1 h-1 rounded-full bg-gray-600 opacity-50 mt-0.5" />
                            </div>
                        </div>
                    );
                })}

                {/* Hint khi đang placing */}
                {isPlacingPin && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg pointer-events-none animate-in fade-in duration-200">
                        Nhấp vào bản đồ để đặt pin · ESC để hủy
                    </div>
                )}
            </div>

            {/* ── LAYER PANEL (góc trên phải) ───────────────────────────── */}
            <LayerPanel
                layers={mapData.layers}
                visibleLayerIds={visibleLayerIds}
                activeLayerId={activeLayerId}
                onToggleLayer={id => setVisibleLayerIds(prev => {
                    const s = new Set(prev);
                    s.has(id) ? s.delete(id) : s.add(id);
                    return s;
                })}
                onSelectLayer={setActiveLayerId}
                onCreateLayer={handleCreateLayer}
                onRenameLayer={handleRenameLayer}
                onDeleteLayer={handleDeleteLayer}
            />

            {/* ── PIN POPUP ─────────────────────────────────────────────── */}
            {popup && (
                <PinPopup
                    pin={popup.pin}
                    x={popup.x}
                    y={popup.y}
                    worldId={worldId}
                    mode={popup.mode}
                    onClose={() => setPopup(null)}
                    onSave={handleSavePin}
                    onDelete={handleDeletePin}
                    onNavigateArticle={onNavigateArticle
                        ? (articleId) => {
                            onNavigateArticle(articleId, popup.pin.articleType ?? '');
                        }
                        : undefined
                    }
                />
            )}
        </div>
    );
}