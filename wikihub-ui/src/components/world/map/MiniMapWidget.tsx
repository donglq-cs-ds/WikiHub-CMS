import { useState, useEffect } from 'react';
import { MapPin, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPinsByArticle, getImageUrl } from '../../../api/mapApi';
import type { ArticlePinLocation } from '../../../api/mapApi';

interface Props {
    articleId: string;
    onOpenMap?: (mapId: string) => void;
}

export default function MiniMapWidget({ articleId, onOpenMap }: Props) {
    const [pins, setPins] = useState<ArticlePinLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);

    useEffect(() => {
        if (!articleId) return;
        setLoading(true);
        getPinsByArticle(articleId)
            .then(data => setPins(data.pins ?? []))
            .catch(() => setPins([]))
            .finally(() => setLoading(false));
    }, [articleId]);

    if (loading || pins.length === 0) return null;

    const current = pins[currentIdx];
    const bgUrl = getImageUrl(current.mapBackgroundImagePath);

    return (
        <div className="my-6 rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                    <MapPin size={12} className="text-blue-500" />
                    Vị trí trên bản đồ
                </div>
                {pins.length > 1 && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentIdx(i => (i - 1 + pins.length) % pins.length)}
                            className="p-0.5 text-gray-400 hover:text-gray-700 rounded transition-colors">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs text-gray-400">{currentIdx + 1}/{pins.length}</span>
                        <button onClick={() => setCurrentIdx(i => (i + 1) % pins.length)}
                            className="p-0.5 text-gray-400 hover:text-gray-700 rounded transition-colors">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Mini map preview */}
            <div className="relative h-36 bg-[#f0ece4] overflow-hidden">
                {bgUrl ? (
                    <img src={bgUrl} alt="map" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <svg className="absolute inset-0 w-full h-full opacity-10">
                        <defs>
                            <pattern id="mini-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="gray" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#mini-grid)" />
                    </svg>
                )}

                {/* Overlay mờ */}
                <div className="absolute inset-0 bg-black/10" />

                {/* Pin marker */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${current.x * 100}%`,
                        top: `${current.y * 100}%`,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs">
                        📍
                    </div>
                    {current.label && (
                        <span className="mt-0.5 px-1.5 py-0.5 bg-white/90 text-[10px] font-bold text-gray-800 rounded shadow-sm whitespace-nowrap block text-center border border-gray-200">
                            {current.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-bold text-gray-700">{current.mapTitle}</span>
                {onOpenMap && (
                    <button
                        onClick={() => onOpenMap(current.mapId)}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Mở bản đồ <ExternalLink size={11} />
                    </button>
                )}
            </div>
        </div>
    );
}