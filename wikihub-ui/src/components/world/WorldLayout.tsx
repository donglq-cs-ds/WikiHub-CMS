import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronRight, FileText, LayoutTemplate, PanelLeftClose, PanelLeft, X, Upload, Link as LinkIcon, Settings } from 'lucide-react'; import { getWorld } from '../../api/worldApi';
import type { World } from '../../types/world';
import { getArticles, createArticle, deleteArticle } from '../../api/articleApi';
import type { Article } from '../../api/articleApi';
import ArticleManager from './ArticleManager';
import ArticleReader from './ArticleReader';
import ArticleEditor from './ArticleEditor';
import TemplateManager from './TemplateManager';
import MapSidebar from './map/MapSidebar';
import WorldMapView from './map/WorldMapView';
import { useNavigate } from 'react-router-dom';

import { CATEGORIES } from '../../constants/entityTypes';


export default function WorldLayout() {
    const { worldId } = useParams();
    const [world, setWorld] = useState<World | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCats, setExpandedCats] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    // STATE CHO TÌM KIẾM BÀI VIẾT (GLOBAL SEARCH)
    const [articleSearchTerm, setArticleSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (worldId) {
            getWorld(worldId)
                .then(setWorld)
                .catch((error) => {
                    console.error("World không tồn tại:", error);
                    navigate('/'); // Tự động về Lobby nếu World không tìm thấy
                });
        }
    }, [worldId, navigate]);
    // Click ra ngoài để đóng dropdown tìm kiếm
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Gọi API tìm kiếm bài viết (Debounce 300ms chống spam API)
    useEffect(() => {
        if (!articleSearchTerm.trim() || !worldId) {
            setSearchResults([]);
            setIsSearchOpen(false);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`${import.meta.env.VITE_API_URL}/api/Articles/search?q=${encodeURIComponent(articleSearchTerm)}&worldId=${worldId}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                    setIsSearchOpen(true);
                })
                .catch(console.error);
        }, 300);
        return () => clearTimeout(timer);
    }, [articleSearchTerm, worldId]);

    type ViewState =
        | { mode: 'overview' }
        | { mode: 'list', typeName: string }
        | { mode: 'read', typeName: string, articleId: string }
        | { mode: 'edit', typeName: string, articleId: string }
        | { mode: 'templates' }
        | { mode: 'editTemplate', templateId: string };
        | { mode: 'map', mapId: string }
    const [viewState, setViewState] = useState<ViewState>({ mode: 'overview' });
    const [articles, setArticles] = useState<Article[]>([]);
    const [activeSort, setActiveSort] = useState('CreatedAt');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [imageType, setImageType] = useState<'file' | 'url'>('file');
    const [imageUrl, setImageUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; targetType: string | null }>({
        visible: false, x: 0, y: 0, targetType: null
    });
    const currentTypeName = viewState.mode !== 'overview' && 'typeName' in viewState ? viewState.typeName : '';
    const isOverview = viewState.mode === 'overview';

    useEffect(() => {
        if (worldId) {
            getWorld(worldId).then(setWorld).catch(console.error);
        }
    }, [worldId]);

    useEffect(() => {
        if (worldId && viewState.mode !== 'templates' && viewState.mode !== 'editTemplate') {
            getArticles({
                worldId,
                type: currentTypeName || undefined,
                isOverview: isOverview ? true : undefined,
                sortBy: activeSort
            }).then(setArticles).catch(console.error);
        }
    }, [worldId, currentTypeName, isOverview, activeSort, refreshTrigger, viewState.mode]);

    const filteredCategories = CATEGORIES.map(cat => ({
        ...cat,
        types: cat.types.filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(cat => cat.types.length > 0);

    useEffect(() => {
        if (searchTerm) {
            setExpandedCats(filteredCategories.map(c => c.id));
            setIsSidebarOpen(true);
        } else {
            setExpandedCats([]);
        }
    }, [searchTerm]);

    const handleContextMenu = (e: React.MouseEvent, type: string) => {
        e.preventDefault();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetType: type });
    };

    useEffect(() => {
        const closeMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const handleCreateArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!worldId || !contextMenu.targetType) return;

        const formData = new FormData();
        formData.append('Title', newTitle);
        formData.append('Description', newDesc);
        formData.append('Type', contextMenu.targetType);

        // Cờ nhận diện Tổng quan
        formData.append('IsOverview', contextMenu.targetType === 'Tổng quan' ? 'true' : 'false');

        if (imageType === 'file' && fileInputRef.current?.files?.[0]) {
            formData.append('ImageFile', fileInputRef.current.files[0]);
        } else if (imageType === 'url' && imageUrl) {
            formData.append('ImageUrl', imageUrl);
        }

        try {
            await createArticle(worldId, formData);
            setNewTitle('');
            setNewDesc('');
            setImageUrl('');
            setIsModalOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error(error);
            alert('Lỗi tạo bài viết.');
        }
    };

    const handleDeleteArticle = async (id: string) => {
        if (window.confirm("Xóa bài viết này? Data và file ảnh vật lý trên BE sẽ bị dọn sạch.")) {
            await deleteArticle(id);
            setRefreshTrigger(prev => prev + 1);
        }
    };

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            <aside className={`bg-[#FBFBFC] flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-200 ${isSidebarOpen ? 'w-72' : 'w-0 border-r-0'}`}>
                <div className="w-72 flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200">
                        <button
                            onClick={() => setViewState({ mode: 'overview' })}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold transition-colors ${viewState.mode === 'overview' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                        >
                            <LayoutTemplate size={18} /> Tổng quan thế giới
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                        {filteredCategories.map(cat => (
                            <div key={cat.id} className="mb-2">
                                <button onClick={() => setExpandedCats(p => p.includes(cat.id) ? p.filter(id => id !== cat.id) : [...p, cat.id])} className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-700 font-bold hover:bg-gray-200 rounded-lg transition-colors group">
                                    <span className="text-gray-400 group-hover:text-gray-600">{expandedCats.includes(cat.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                                    <span className="text-sm truncate">{cat.title}</span>
                                </button>

                                {expandedCats.includes(cat.id) && (
                                    <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-2">
                                        {cat.types.map(type => (
                                            <div
                                                key={type}
                                                onClick={() => setViewState({ mode: 'list', typeName: type })}
                                                onContextMenu={(e) => handleContextMenu(e, type)}
                                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${(viewState.mode === 'list' || viewState.mode === 'read' || viewState.mode === 'edit') && viewState.typeName === type ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                                            >
                                                <FileText size={14} className="text-gray-400" />
                                                {type}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <MapSidebar
                                worldId={worldId || ''}
                                activeMapId={viewState.mode === 'map' ? viewState.mapId : null}
                                onSelectMap={(mapId) => setViewState({ mode: 'map', mapId })}
                            />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <header className="h-14 border-b border-gray-200 px-4 flex items-center gap-3 bg-white shrink-0">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">{isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}</button>
                    <Link to="/" className="text-xl font-black text-blue-600 tracking-tight hover:opacity-80 transition-opacity ml-1">WikiHub</Link>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                    <span className="font-bold text-gray-800 truncate max-w-xs">{world ? world.name : 'Đang tải dữ liệu...'}</span>

                    {/* KHU VỰC GÓC PHẢI (SEARCH + BÁNH RĂNG) */}
                    <div className="ml-auto flex items-center gap-3">
                        {/* THANH TÌM KIẾM BÀI VIẾT GLOBAL */}
                        <div className="relative w-64" ref={searchRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm bài viết..."
                                value={articleSearchTerm}
                                onChange={(e) => setArticleSearchTerm(e.target.value)}
                                onFocus={() => { if (articleSearchTerm.trim()) setIsSearchOpen(true); }}
                                className="w-full bg-gray-100 rounded-md py-1.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white border border-transparent transition-all"
                            />

                            {/* DROPDOWN KẾT QUẢ */}
                            {isSearchOpen && articleSearchTerm.trim() !== '' && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Kết quả tìm kiếm
                                    </div>
                                    {searchResults.length > 0 ? (
                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {searchResults.map(res => (
                                                <button
                                                    key={res.id}
                                                    onClick={() => {
                                                        // Chuyển thẳng tới trang Đọc Bài Viết của kết quả này
                                                        setViewState({ mode: 'read', typeName: res.type, articleId: res.id });
                                                        setIsSearchOpen(false);
                                                        setArticleSearchTerm('');
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex flex-col gap-1 group"
                                                >
                                                    <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 truncate">{res.title}</span>
                                                    <span className="text-[10px] text-gray-500 font-semibold bg-gray-200 px-2 py-0.5 rounded w-fit">{res.type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-sm text-gray-500">
                                            Không tìm thấy "<span className="font-bold text-gray-800">{articleSearchTerm}</span>"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* NÚT BÁNH RĂNG QUẢN LÝ TEMPLATE */}
                        <button
                            onClick={() => setViewState({ mode: 'templates' })}
                            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors"
                            title="Quản lý khuôn mẫu"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden p-8 bg-white">
                    {/* TỔNG QUAN */}
                    {viewState.mode === 'overview' && (
                        articles.length > 0 ? (
                            <ArticleReader
                                articleId={articles[0].id}
                                worldId={worldId || ''}
                                onBack={() => { }}
                                onEdit={() => setViewState({ mode: 'edit', typeName: 'Tổng quan', articleId: articles[0].id })}
                                onNavigate={async (id) => {
                                    try {
                                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Articles/${id}`);
                                        const art = await res.json();
                                        setViewState({ mode: 'read', typeName: art.type || '', articleId: id });
                                    } catch {
                                        setViewState({ mode: 'read', typeName: '', articleId: id });
                                    }
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl">
                                <LayoutTemplate size={48} className="text-gray-300 mb-4" />
                                <h3 className="text-lg font-black mb-2 text-gray-700">Chưa có bài Tổng quan</h3>
                                <p className="text-sm text-gray-500 mb-6">Hãy tạo một bài viết để giới thiệu chung về thế giới của ông.</p>
                                <button
                                    onClick={() => {
                                        setContextMenu(prev => ({ ...prev, targetType: 'Tổng quan' }));
                                        setIsModalOpen(true);
                                    }}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    + Tạo bài Tổng quan
                                </button>
                            </div>
                        )
                    )}

                    {/* DANH SÁCH BÀI VIẾT */}
                    {viewState.mode === 'list' && (
                        <ArticleManager
                            typeName={viewState.typeName}
                            articles={articles}
                            activeSort={activeSort}
                            onSortChange={setActiveSort}
                            onDelete={handleDeleteArticle}
                            onCreateClick={() => {
                                setContextMenu(prev => ({ ...prev, targetType: viewState.typeName }));
                                setIsModalOpen(true);
                            }}
                            onRead={(id) => setViewState({ mode: 'read', typeName: viewState.typeName, articleId: id })}
                            onEdit={(id) => setViewState({ mode: 'edit', typeName: viewState.typeName, articleId: id })}
                        />
                    )}

                    {/* ĐỌC BÀI VIẾT */}
                    {viewState.mode === 'read' && (
                        <ArticleReader
                            articleId={viewState.articleId}
                            worldId={worldId || ''}
                            onBack={() => setViewState({ mode: 'list', typeName: viewState.typeName })}
                            onEdit={() => setViewState({ mode: 'edit', typeName: viewState.typeName, articleId: viewState.articleId })}
                            onNavigate={async (id) => {
                                try {
                                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Articles/${id}`);
                                    const art = await res.json();
                                    setViewState({ mode: 'read', typeName: art.type || '', articleId: id });
                                } catch {
                                    setViewState({ mode: 'read', typeName: '', articleId: id });
                                }
                            }}
                        />
                    )}

                    {/* SỬA BÀI VIẾT */}
                    {viewState.mode === 'edit' && (
                        <ArticleEditor
                            articleId={viewState.articleId}
                            worldId={worldId || ''}
                            onBack={() => {
                                if (viewState.typeName === 'Tổng quan') {
                                    setViewState({ mode: 'overview' });
                                } else {
                                    setViewState({ mode: 'list', typeName: viewState.typeName });
                                }
                            }}
                        />
                    )}

                    {/* QUẢN LÝ KHUÔN MẪU */}
                    {viewState.mode === 'templates' && (
                        <TemplateManager
                            onBack={() => setViewState({ mode: 'overview' })}
                            onEdit={(id) => setViewState({ mode: 'editTemplate', templateId: id })}
                        />
                    )}

                    {/* SOẠN NỘI DUNG KHUÔN MẪU */}
                    {viewState.mode === 'editTemplate' && (
                        <ArticleEditor
                            articleId={viewState.templateId}
                            worldId={worldId || ''}
                            isTemplate={true}
                            onBack={() => setViewState({ mode: 'templates' })}
                        />
                    )}
                    {/* BẢN ĐỒ */}
                    {viewState.mode === 'map' && (
                        <WorldMapView
                            mapId={viewState.mapId}
                            worldId={worldId || ''}
                            onNavigateArticle={async (articleId, type) => {
                                setViewState({ mode: 'read', typeName: type, articleId });
                            }}
                        />
                    )}
                </div>
            </main>

            {contextMenu.visible && (
                <div className="fixed bg-white border border-gray-200 shadow-xl rounded-lg py-1 w-48 z-50" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <button onClick={() => setIsModalOpen(true)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        Tạo mới {contextMenu.targetType}
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-1 rounded-full"><X size={18} /></button>
                        <h2 className="text-xl font-black mb-5 text-gray-800">Tạo {contextMenu.targetType} Mới</h2>
                        <form onSubmit={handleCreateArticle} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề bài viết</label>
                                <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-blue-500 transition-colors" placeholder="Nhập tên..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                                <textarea rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 outline-none focus:border-blue-500 transition-colors resize-none" placeholder="Nhập tóm tắt..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh đại diện</label>
                                <div className="flex gap-4 mb-2">
                                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border-2 font-bold ${imageType === 'file' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}><input type="radio" className="hidden" checked={imageType === 'file'} onChange={() => setImageType('file')} /><Upload size={14} /> Từ máy</label>
                                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border-2 font-bold ${imageType === 'url' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}><input type="radio" className="hidden" checked={imageType === 'url'} onChange={() => setImageType('url')} /><LinkIcon size={14} /> Dùng URL</label>
                                </div>
                                {imageType === 'file' ? <input type="file" accept="image/*" ref={fileInputRef} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" /> : <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500" placeholder="https://..." />}
                            </div>
                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700">Tạo bài</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}