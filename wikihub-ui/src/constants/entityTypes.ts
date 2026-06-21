export interface EntityCategory {
    id: string;
    title: string;
    types: string[];
}

export const CATEGORIES: EntityCategory[] = [
    { id: '1', title: 'Nhân vật & Xã hội', types: ['Nhân vật', 'Gia tộc/Dòng họ', 'Chủng tộc/Sắc tộc', 'Nghề nghiệp/Ngành nghề'] },
    { id: '2', title: 'Chính trị & Quân sự', types: ['Quốc gia', 'Phe phái/Tổ chức', 'Quân đội', 'Xung đột', 'Trận chiến', 'Sự kiện'] },
    { id: '3', title: 'Địa lý & Không gian', types: ['Địa lý', 'Khu định cư', 'Công trình', 'Phương tiện giao thông', 'Cõi giới/Chiều không gian'] },
    { id: '4', title: 'Sinh vật & Tự nhiên', types: ['Loài', 'Thực vật', 'Quái vật', 'Sinh vật huyền thoại', 'Thực thể siêu nhiên', 'Bệnh tật/Nguyền rủa'] },
    { id: '5', title: 'Văn hóa & Tín ngưỡng', types: ['Tôn giáo', 'Truyền thống', 'Thần thoại/Truyền thuyết', 'Ngôn ngữ', 'Văn bản/Tư liệu', 'Nghệ thuật'] },
    { id: '6', title: 'Vật phẩm & Kinh tế', types: ['Vật phẩm', 'Vật liệu', 'Phát minh', 'Dược phẩm/Thuốc', 'Tiền tệ'] },
    { id: '7', title: 'Lý thuyết & Quy luật Vũ trụ', types: ['Quy luật tự nhiên', 'Ngành khoa học/Công nghệ', 'Nguồn năng lượng/Tài nguyên'] },
];