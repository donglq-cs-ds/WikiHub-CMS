import { useState, useEffect } from 'react';
import { Search, Plus, ArrowDownAZ, CalendarDays, Clock } from 'lucide-react';
import WorldCard from './WorldCard';
import CreateWorldModal from './CreateWorldModal';
import type { World } from '../../types/world';
import { getWorlds, createWorld, deleteWorld } from '../../api/worldApi';

export default function Lobby() {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeSort, setActiveSort] = useState('CreatedAt');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Biến "cò súng" để yêu cầu useEffect tải lại dữ liệu
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Chờ người dùng ngừng gõ 500ms rồi mới cập nhật từ khóa tìm kiếm
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // CHUẨN CLEAN CODE: Khai báo logic gọi API trực tiếp bên trong useEffect
    useEffect(() => {
        let isMounted = true; // Kỹ thuật dọn dẹp (Cleanup) chống Memory Leak

        const loadWorlds = async () => {
            try {
                const data = await getWorlds({ searchTerm: debouncedSearch, sortBy: activeSort });
                if (isMounted) {
                    setWorlds(data.items);
                }
            } catch (error) {
                console.error("Lỗi tải danh sách:", error);
            }
        };

        loadWorlds();

        // Cleanup function sẽ chạy khi component bị hủy hoặc trước khi useEffect chạy lại lần tới
        return () => {
            isMounted = false;
        };
    }, [debouncedSearch, activeSort, refreshTrigger]); // Theo dõi thêm refreshTrigger

    // Xử lý tạo mới
    const handleCreateWorld = async (formData: FormData) => {
        await createWorld(formData);
        // Tăng số biến cò súng lên 1 -> useEffect phát hiện thay đổi sẽ tự động chạy lại gọi API
        setRefreshTrigger(prev => prev + 1);
    };

    // Xử lý xóa
    const handleDeleteWorld = async (id: string) => {
        try {
            await deleteWorld(id);
            // Xóa xong kích cò súng để tự động load lại danh sách mới nhất
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert('Lỗi khi xóa! Xem console để biết chi tiết.');
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
                    <h1 className="text-3xl font-black text-blue-600 tracking-tighter">WikiHub</h1>
                    <div className="flex-1 max-w-2xl relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text" placeholder="Tìm kiếm thế giới..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 rounded-full py-2.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all border border-transparent focus:border-blue-500"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                <div className="flex justify-end gap-3 mb-8">
                    <button onClick={() => setActiveSort('Name')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSort === 'Name' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        <ArrowDownAZ size={18} /> A-Z
                    </button>
                    <button onClick={() => setActiveSort('CreatedAt')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSort === 'CreatedAt' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        <CalendarDays size={18} /> Mới nhất
                    </button>
                    <button onClick={() => setActiveSort('UpdatedAt')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSort === 'UpdatedAt' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        <Clock size={18} /> Vừa sửa
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-50/50 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center h-72 text-blue-600 group shadow-sm">
                        <div className="bg-white p-4 rounded-full shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                            <Plus size={36} className="text-blue-600" />
                        </div>
                        <span className="mt-5 font-bold text-lg tracking-wide">Tạo Thế Giới Mới</span>
                    </div>

                    {worlds.map(world => (
                        <WorldCard 
                            key={world.id} 
                            world={world} 
                            onDelete={handleDeleteWorld} 
                        />
                    ))}
                </div>
            </main>

            <CreateWorldModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateWorld}
            />
        </div>
    );
}