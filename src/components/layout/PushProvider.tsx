'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { pushBildirimAbone, pushAboneligiKaydet } from '@/lib/push';

interface PushProviderProps {
    children: React.ReactNode;
}

export default function PushProvider({ children }: PushProviderProps) {
    const { kullanici, token } = useAuthStore();

    useEffect(() => {
        if (!kullanici || !token) return;

        const initPush = async () => {
            try {
                const sub = await pushBildirimAbone();
                if (sub) {
                    await pushAboneligiKaydet(sub, token);
                }
            } catch (err) {
                console.error('Push notification registration failed:', err);
            }
        };

        // Service Worker hazır olduğunda push kaydını başlat
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                initPush();
            });
        }
    }, [kullanici, token]);

    return <>{children}</>;
}
