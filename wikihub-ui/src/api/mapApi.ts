import axiosClient from './axiosClient';

const API_URL = import.meta.env.VITE_API_URL;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MapPinDto {
    id: string;
    mapId: string;
    layerIds: string[];
    articleId?: string;
    x: number;
    y: number;
    label: string;
    pinType: string;
    color: string;
    articleTitle?: string;
    articleType?: string;
    articleImagePath?: string;
}

export interface MapLayerDto {
    id: string;
    mapId: string;
    name: string;
    order: number;
    isVisibleByDefault: boolean;
    shapes: any[];
    pins: MapPinDto[];
}

export interface WorldMapDto {
    id: string;
    worldId: string;
    title: string;
    backgroundImagePath?: string;
    createdAt: string;
    updatedAt: string;
    layers: MapLayerDto[];
}

export interface MapSummary {
    id: string;
    worldId: string;
    title: string;
    backgroundImagePath?: string;
    createdAt: string;
    updatedAt: string;
    layerCount: number;
}

export interface ArticlePinLocation {
    pinId: string;
    mapId: string;
    mapTitle: string;
    mapBackgroundImagePath?: string;
    x: number;
    y: number;
    label: string;
}

export interface ArticlePinsDto {
    articleId: string;
    pins: ArticlePinLocation[];
}

// ── WorldMap ───────────────────────────────────────────────────────────────────

export const getMaps = async (worldId: string): Promise<MapSummary[]> => {
    const res = await axiosClient.get('/maps', { params: { worldId } });
    return res.data;
};

export const getMap = async (id: string): Promise<WorldMapDto> => {
    const res = await axiosClient.get(`/maps/${id}`);
    return res.data;
};

export const createMap = async (worldId: string, title: string): Promise<{ id: string; title: string }> => {
    const res = await axiosClient.post(`/maps?worldId=${worldId}`, { title });
    return res.data;
};

export const updateMap = async (id: string, title: string): Promise<void> => {
    await axiosClient.put(`/maps/${id}`, { id, title });
};

export const deleteMap = async (id: string): Promise<void> => {
    await axiosClient.delete(`/maps/${id}`);
};

export const uploadBackground = async (mapId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('ImageFile', file);
    const res = await axiosClient.post(`/maps/${mapId}/background`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
};

// ── Layer ──────────────────────────────────────────────────────────────────────

export const createLayer = async (mapId: string, name: string, order: number): Promise<MapLayerDto> => {
    const res = await axiosClient.post(`/maps/${mapId}/layers`, {
        name, order, isVisibleByDefault: true,
    });
    return res.data;
};

export const updateLayer = async (
    mapId: string,
    layerId: string,
    data: { name: string; order: number; isVisibleByDefault: boolean }
): Promise<void> => {
    await axiosClient.put(`/maps/${mapId}/layers/${layerId}`, { id: layerId, ...data });
};

export const deleteLayer = async (mapId: string, layerId: string): Promise<void> => {
    await axiosClient.delete(`/maps/${mapId}/layers/${layerId}`);
};

// ── Pin ────────────────────────────────────────────────────────────────────────

export const createPin = async (
    mapId: string,
    data: {
        layerIds: string[];
        articleId?: string;
        x: number;
        y: number;
        label: string;
        pinType: string;
        color: string;
    }
): Promise<MapPinDto> => {
    const res = await axiosClient.post(`/maps/${mapId}/pins`, data);
    return res.data;
};

export const updatePin = async (
    mapId: string,
    pinId: string,
    data: {
        layerIds: string[];
        articleId?: string;
        x: number;
        y: number;
        label: string;
        pinType: string;
        color: string;
    }
): Promise<void> => {
    await axiosClient.put(`/maps/${mapId}/pins/${pinId}`, { id: pinId, ...data });
};

export const deletePin = async (mapId: string, pinId: string): Promise<void> => {
    await axiosClient.delete(`/maps/${mapId}/pins/${pinId}`);
};

// ── Mini-map (ArticleReader) ───────────────────────────────────────────────────

export const getPinsByArticle = async (articleId: string): Promise<ArticlePinsDto> => {
    const res = await axiosClient.get(`/maps/article/${articleId}/pins`);
    return res.data;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export const getImageUrl = (path?: string): string => {
    if (!path) return '';
    if (path.startsWith('/images/')) return `${API_URL}${path}`;
    return path;
};