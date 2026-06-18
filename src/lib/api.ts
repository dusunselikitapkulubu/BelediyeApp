import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: token ekle
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        try {
            const auth = JSON.parse(localStorage.getItem('belediye-auth') || '{}');
            const token = auth?.state?.token;
            if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch { }
    }
    return config;
});

// Response interceptor: 401 yönlendirmesi
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('belediye-auth');
            window.location.href = '/giris';
        }
        return Promise.reject(error);
    }
);

export default api;

// ─── API Fonksiyonları ────────────────────────────────────────────────────

import type { Talep, TalepOlusturDTO, Kullanici, Bildirim } from '@/types';

export const talepAPI = {
    liste: (params?: { durum?: string; sayfa?: number }) =>
        api.get<{ items: Talep[]; total: number }>('/talep', { params }),

    detay: (id: string) => api.get<Talep>(`/talep/${id}`),

    olustur: (data: TalepOlusturDTO) => api.post<Talep>('/talep', data),

    guncelle: (id: string, data: Partial<Talep>) =>
        api.patch<Talep>(`/talep/${id}`, data),
};

export const profilAPI = {
    getir: () => api.get<Kullanici>('/profil'),
    guncelle: (data: Partial<Kullanici>) => api.patch<Kullanici>('/profil', data),
};

export const bildirimAPI = {
    liste: () => api.get<Bildirim[]>('/bildirim'),
    okunduIsaretle: (id: string) => api.patch(`/bildirim/${id}/okundu`),
    hepsiniOkunduIsaretle: () => api.patch('/bildirim/hepsini-okundu'),
    aboneOl: (subscription: object) =>
        api.post('/bildirim/abone', { subscription }),
};

export const uploadAPI = {
    foto: (formData: FormData) =>
        api.post<{ id: string; url: string; thumbnail: string }>(
            '/upload/foto',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        ),
};
