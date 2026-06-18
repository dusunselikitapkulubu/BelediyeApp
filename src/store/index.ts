import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Kullanici, Talep, Bildirim } from '@/types';

// ─── Auth Store ───────────────────────────────────────────────────────────

interface AuthState {
    kullanici: Kullanici | null;
    token: string | null;
    isLoading: boolean;
    kayitliKullanicilar: Record<string, Kullanici>;
    setKullanici: (k: Kullanici, token: string) => void;
    updateKullanici: (partial: Partial<Kullanici>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            kullanici: null,
            token: null,
            isLoading: false,
            kayitliKullanicilar: {},
            setKullanici: (kullanici, token) =>
                set((state) => {
                    const saved = state.kayitliKullanicilar?.[kullanici.email];
                    const finalKullanici = saved
                        ? { ...kullanici, ...saved, email: kullanici.email, id: kullanici.id }
                        : kullanici;
                    return {
                        kullanici: finalKullanici,
                        token,
                        kayitliKullanicilar: {
                            ...state.kayitliKullanicilar,
                            [kullanici.email]: finalKullanici,
                        },
                    };
                }),
            updateKullanici: (partial) =>
                set((state) => {
                    if (!state.kullanici) return {};
                    const guncellenmis = { ...state.kullanici, ...partial };
                    return {
                        kullanici: guncellenmis,
                        kayitliKullanicilar: {
                            ...state.kayitliKullanicilar,
                            [state.kullanici.email]: guncellenmis,
                        },
                    };
                }),
            logout: () => set({ kullanici: null, token: null }),
        }),
        {
            name: 'belediye-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                kullanici: state.kullanici,
                token: state.token,
                kayitliKullanicilar: state.kayitliKullanicilar || {},
            }),
        }
    )
);

// ─── Talep Store ──────────────────────────────────────────────────────────

interface TalepState {
    talepler: Talep[];
    yukleniyor: boolean;
    setTalepler: (t: Talep[]) => void;
    setYukleniyor: (y: boolean) => void;
    addTalep: (t: Talep) => void;
    updateTalep: (id: string, partial: Partial<Talep>) => void;
    removeTalep: (id: string) => void;
}

export const useTalepStore = create<TalepState>((set) => ({
    talepler: [],
    yukleniyor: false,
    setTalepler: (talepler) => set({ talepler, yukleniyor: false }),
    setYukleniyor: (yukleniyor) => set({ yukleniyor }),
    addTalep: (talep) =>
        set((state) => ({ talepler: [talep, ...state.talepler] })),
    updateTalep: (id, partial) =>
        set((state) => ({
            talepler: state.talepler.map((t) =>
                t.id === id ? { ...t, ...partial } : t
            ),
        })),
    removeTalep: (id) =>
        set((state) => ({
            talepler: state.talepler.filter((t) => t.id !== id),
        })),
}));

// ─── Bildirim Store ───────────────────────────────────────────────────────

interface BildirimState {
    bildirimler: Bildirim[];
    okunmamisSayi: number;
    addBildirim: (b: Bildirim) => void;
    markOkundu: (id: string) => void;
    markHepsiniOkundu: () => void;
    setBildirimler: (bs: Bildirim[]) => void;
}

export const useBildirimStore = create<BildirimState>()(
    persist(
        (set) => ({
            bildirimler: [],
            okunmamisSayi: 0,
            setBildirimler: (bildirimler) =>
                set({
                    bildirimler,
                    okunmamisSayi: bildirimler.filter((b) => !b.okundu).length,
                }),
            addBildirim: (b) =>
                set((state) => ({
                    bildirimler: [b, ...state.bildirimler],
                    okunmamisSayi: state.okunmamisSayi + (b.okundu ? 0 : 1),
                })),
            markOkundu: (id) =>
                set((state) => ({
                    bildirimler: state.bildirimler.map((b) =>
                        b.id === id ? { ...b, okundu: true } : b
                    ),
                    okunmamisSayi: Math.max(0, state.okunmamisSayi - 1),
                })),
            markHepsiniOkundu: () =>
                set((state) => ({
                    bildirimler: state.bildirimler.map((b) => ({ ...b, okundu: true })),
                    okunmamisSayi: 0,
                })),
        }),
        {
            name: 'belediye-bildirimler',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
