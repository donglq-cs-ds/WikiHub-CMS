import axiosClient from './axiosClient';

export interface Article {
    id: string;
    worldId: string;
    title: string;
    description?: string;
    content?: string;
    type: string;
    imagePath?: string;
    isOverview: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getArticles = async (params: { worldId: string; type?: string; isOverview?: boolean; sortBy?: string }) => {
    const response = await axiosClient.get<Article[]>('/articles', { params });
    return response.data;
};

export const createArticle = async (worldId: string, data: FormData) => {
    data.append('worldId', worldId);
    const response = await axiosClient.post<Article>('/articles', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteArticle = async (id: string) => {
    await axiosClient.delete(`/articles/${id}`);
};