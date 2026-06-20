import axiosClient from './axiosClient';
import type { World } from '../types/world';

export interface PagedResult<T> {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
}

export const getWorlds = async (params: {
    searchTerm?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
}) => {
    const response = await axiosClient.get<PagedResult<World>>('/worlds', { params });
    return response.data;
};

export const createWorld = async (data: FormData) => {
    const response = await axiosClient.post<World>('/worlds', data, {
        // Cần header multipart/form-data để upload file ảnh
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
export const deleteWorld = async (id: string) => {
    await axiosClient.delete(`/worlds/${id}`);
};
export const getWorld = async (id: string) => {
    const response = await axiosClient.get<World>(`/worlds/${id}`);
    return response.data;
};