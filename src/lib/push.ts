/**
 * Web Push Notification Yöneticisi
 * VAPID tabanlı push bildirimleri için yardımcı fonksiyonlar.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Base64 URL string'i Uint8Array'e çevir (VAPID key için)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Push bildirimleri için izin iste ve abonelik oluştur
 */
export async function pushBildirimAbone(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push bildirimleri desteklenmiyor');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) return existingSubscription;

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
        });

        return subscription;
    } catch (err) {
        console.error('Push abonelik hatası:', err);
        return null;
    }
}

/**
 * Aboneliği sunucuya kaydet
 */
export async function pushAboneligiKaydet(
    subscription: PushSubscription,
    token: string
): Promise<boolean> {
    try {
        const res = await fetch('/api/bildirim/abone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Push aboneliğini iptal et
 */
export async function pushAboneligiIptal(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Bildirim iznini kontrol et
 */
export function getBildirimIzni(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

/**
 * Yerel bildirim göster (push olmadan)
 */
export function yerelBildirimGoster(
    baslik: string,
    options?: NotificationOptions
): void {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(baslik, options);
    }
}

export interface PushSubscriptionJSON {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Sunucu tarafı: Web Push gönder (API route'dan çağrılır)
 * web-push paketi gerektirir: npm install web-push
 */
export async function sunucuPushGonder(
    subscriptionJson: string,
    payload: {
        title: string;
        body: string;
        url?: string;
        talepId?: string;
        tag?: string;
    }
): Promise<void> {
    // Bu fonksiyon yalnızca API route'larında (Node.js) çalışır
    console.log('Push gönderildi (mock):', payload);
}
