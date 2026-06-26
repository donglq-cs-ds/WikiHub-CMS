import { useState, useRef, useEffect } from 'react';
import { X, Link2, Trash2, Check, MapPin as MapPinIcon } from 'lucide-react';
import type { MapPinDto } from '../../../api/mapApi';

const API_URL = import.meta.env.VITE_API_URL;

const PIN_TYPES = [
    { value: 'location', label: 'Địa điểm', emoji: '📍' },
    { value: 'city', label: 'Thành phố', emoji: '🏙️' },
    { value: 'dungeon', label: 'Ngục tối', emoji: '⚓' },
    { value: 'event', label: 'Sự kiện', emoji: '⚡' },
    { value: 'character', label: 'Nhân vật', emoji: '👤' },
    { value: 'custom', label: 'Khác', emoji: '🔖' },
];

const PIN_COLORS = [
    '#E24B4A', '#3B8BD4', '#1D9E75', '#EF9F27',
    '#7F77DD', '#D85A30', '#444441', '#D4537E',
];

interface Props {
    pin: MapPinDto;
    x: number;               // pixel position trên màn hình
    y: number;
    worldId: string;
    mode: 'hover' | 'edit';  // hover = preview nhanh, edit = form đầy đủ
    onClose: () => void;
    onSave: (pinId: string, data: Partial<MapPinDto>) => void;
    onDelete: (pinId: string) => void;
    onNavigateArticle?: (articleId: string) => void;
}

export default function PinPopup({
    pin, x, y, worldId, mode, onClose, onSave, onDelete, onNavigateArticle
}: Props) {
    const [isEdit, setIsEdit] = useState(mode === 'edit');
    const [label, setLabel] = useState(pin.label);
    const [pinType, setPinType] = useState(pin.pinType);
    const [color, setColor] = useState(pin.color);
    const [articleId, setArticleId] = useState(pin.articleId ?? '');
    const [articleSearch, setArticleSearch] = useState(pin.articleTitle ?? '');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Tìm kiếm bài viết để link
    useEffect(() => {
        if (!articleSearch.trim() || !worldId) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_URL}/api/Articles/search?q=${encodeURIComponent(articleSearch)}&worldId=${worldId}`
                );
                const data = await res.json();
                setSearchResults(data);
                setIsSearchOpen(true);
            } catch { /* silent */ }
        }, 300);
        return () => clearTimeout(timer);
    }, [articleSearch, worldId]);

    // Tính vị trí popup: tránh bị tràn ra ngoài màn hình
    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        left: Math.min(x + 16, window.innerWidth - 280),
        top: Math.max(y - 80, 8),
        zIndex: 50,
        width: isEdit ? 280 : 220,
    };

    const handleSave = () => {
        onSave(pin.id, { label, pinType, color, articleId: articleId || undefined });
        setIsEdit(false);
    };

    const getImageUrl = (path?: string) => {
        if (!path) return '';
        if (path.startsWith('/images/')) return `${API_URL}${path}`;
        return path;
    };

    const pinEmoji = PIN_TYPES.find(t => t.value === pin.pinType)?.emoji ?? '📍';

    if (!isEdit) {
        // ── HOVER MODE: preview card ──────────────────────────────────────────
        return (
            <div ref={popupRef} style={popupStyle}
                className="bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {pin.articleImagePath && (
                    <img src={getImageUrl(pin.articleImagePath)}
                        alt="" className="w-full h-24 object-cover" />
                )}
                <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span>{pinEmoji}</span>
                            <span className="font-bold text-sm text-gray-800 truncate">
                                {pin.label || 'Pin không tên'}
                            </span>
                        </div>
                        <button onClick={onClose}
                            className="shrink-0 text-gray-400 hover:text-gray-700 p-0.5 rounded">
                            <X size={14} />
                        </button>
                    </div>
                    {pin.articleTitle && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold truncate">
                                {pin.articleType}
                            </span>
                        </div>
                    )}
                    <div className="flex gap-2 mt-3">
                        {pin.articleId && onNavigateArticle && (
                            <button
                                onClick={() => { onClose(); onNavigateArticle(pin.articleId!); }}
                                className="flex-1 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                                Xem bài viết
                            </button>
                        )}
                        <button
                            onClick={() => setIsEdit(true)}
                            className="flex-1 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Chỉnh sửa
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── EDIT MODE: form đầy đủ ─────────────────────────────────────────────────
    return (
        <div ref={popupRef} style={popupStyle}
            className="bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    <MapPinIcon size={14} className="text-blue-600" /> Sửa pin
                </span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-0.5 rounded">
                    <X size={14} />
                </button>
            </div>

            <div className="p-3 space-y-3">
                {/* Label */}
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Tên pin</label>
                    <input
                        autoFocus
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors"
                        placeholder="Nhập tên địa điểm..."
                    />
                </div>

                {/* Pin type */}
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Loại</label>
                    <div className="grid grid-cols-3 gap-1">
                        {PIN_TYPES.map(t => (
                            <button key={t.value} onClick={() => setPinType(t.value)}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                    pinType === t.value
                                        ? 'bg-blue-600 text-white font-bold'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                <span>{t.emoji}</span> {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color */}
                <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Màu</label>
                    <div className="flex gap-1.5 flex-wrap">
                        {PIN_COLORS.map(c => (
                            <button key={c} onClick={() => setColor(c)}
                                style={{ background: c }}
                                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                                    color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''
                                }`} />
                        ))}
                    </div>
                </div>

                {/* Link bài viết */}
                <div className="relative">
                    <label className="text-xs font-bold text-gray-600 block mb-1 flex items-center gap-1">
                        <Link2 size={11} /> Liên kết bài viết
                    </label>
                    {articleId ? (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                            <span className="text-xs text-blue-700 font-bold flex-1 truncate">
                                {articleSearch || 'Đã chọn'}
                            </span>
                            <button onClick={() => { setArticleId(''); setArticleSearch(''); }}
                                className="text-blue-400 hover:text-red-500 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                value={articleSearch}
                                onChange={e => { setArticleSearch(e.target.value); setArticleId(''); }}
                                onFocus={() => articleSearch && setIsSearchOpen(true)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors"
                                placeholder="Tìm bài viết để link..."
                            />
                            {isSearchOpen && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                                    {searchResults.map(r => (
                                        <button key={r.id}
                                            onClick={() => {
                                                setArticleId(r.id);
                                                setArticleSearch(r.title);
                                                setIsSearchOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors flex items-center gap-2">
                                            <span className="font-bold text-gray-800 truncate">{r.title}</span>
                                            <span className="text-gray-400 shrink-0">{r.type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 bg-gray-50">
                <button onClick={() => {
                    if (window.confirm('Xóa pin này?')) onDelete(pin.id);
                }} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-colors">
                    <Trash2 size={12} /> Xóa
                </button>
                <div className="flex gap-2">
                    <button onClick={onClose}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleSave}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1">
                        <Check size={12} /> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}