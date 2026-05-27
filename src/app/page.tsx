'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  FilePlus, MapPin, CheckCircle2, Clock, AlertCircle,
  ChevronRight, LogOut,
} from 'lucide-react';
import { useAuthStore, useTalepStore } from '@/store';
import { talepAPI } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { TalepTipi, TalepDurumu } from '@/types';

const TIP_META: Record<TalepTipi, { label: string; cls: string }> = {
  'bilgi-edinme': { label: 'Bilgi', cls: 'tip-bilgi' },
  'istek': { label: 'İstek', cls: 'tip-istek' },
  'sikayet': { label: 'Şikayet', cls: 'tip-sikayet' },
  'ihbar': { label: 'İhbar', cls: 'tip-ihbar' },
  'oneri': { label: 'Öneri', cls: 'tip-oneri' },
  'tesekkur': { label: 'Teşekkür', cls: 'tip-tesekkur' },
};

const DURUM_META: Record<TalepDurumu, { label: string; icon: React.ReactNode; cls: string }> = {
  bekliyor: { label: 'Bekliyor', icon: <Clock size={12} />, cls: 'durum-bekliyor' },
  isleniyor: { label: 'İşleniyor', icon: <Clock size={12} />, cls: 'durum-isleniyor' },
  'bekleyen-bilgi': { label: 'Bilgi Bekleniyor', icon: <AlertCircle size={12} />, cls: 'durum-bekliyor' },
  tamamlandi: { label: 'Tamamlandı', icon: <CheckCircle2 size={12} />, cls: 'durum-tamamlandi' },
  reddedildi: { label: 'Reddedildi', icon: <AlertCircle size={12} />, cls: 'durum-reddedildi' },
};

export default function AnaSayfa() {
  const router = useRouter();
  const { kullanici, logout } = useAuthStore();
  const { talepler, setTalepler } = useTalepStore();
  const { data: session } = useSession();

  useEffect(() => {
    if (!kullanici && !session?.user) { router.push('/giris'); return; }
    talepAPI.liste({ sayfa: 1 })
      .then((r) => setTalepler(r.data.items))
      .catch(() => { });
  }, [kullanici, session, router, setTalepler]);

  if (!kullanici && !session?.user) return null;

  // Google'dan gelen bilgileri kullan
  const displayName = kullanici?.adSoyad || session?.user?.name || 'Kullanıcı';
  const displayEmail = kullanici?.email || session?.user?.email || '';
  const isGoogle = !!session?.user;
  const belediyeAd = kullanici?.belediye?.ad || 'Belediye belirlenmedi';

  const handleLogout = async () => {
    logout();
    if (session) {
      await signOut({ callbackUrl: '/giris' });
    } else {
      router.push('/giris');
    }
  };

  const sonTalepler = talepler.slice(0, 3);
  const tamamlananSayi = talepler.filter((t) => t.durum === 'tamamlandi').length;
  const bekleyenSayi = talepler.filter((t) => t.durum === 'bekliyor' || t.durum === 'isleniyor').length;

  return (
    <div className="px-4 pb-8">

      {/* Karşılama */}
      <div className="pt-5 pb-4">
        <p className="text-sm text-gray-500">Merhaba,</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isGoogle && session?.user?.image && (
              <img
                src={session.user.image}
                alt={displayName}
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
          </div>
          <div className="flex items-center gap-2">
            {isGoogle && (
              <span className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </span>
            )}
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Çıkış Yap">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500">{belediyeAd}</span>
          {displayEmail && (
            <>
              <span className="text-gray-300 mx-1">·</span>
              <span className="text-xs text-gray-400">{displayEmail}</span>
            </>
          )}
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Bekleyen</p>
          <p className="text-3xl font-bold text-blue-700">{bekleyenSayi}</p>
          <p className="text-[11px] text-blue-500 mt-1">talep işleniyor</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Tamamlanan</p>
          <p className="text-3xl font-bold text-green-700">{tamamlananSayi}</p>
          <p className="text-[11px] text-green-500 mt-1">talep çözüldü</p>
        </div>
      </div>

      {/* Yeni talep butonu */}
      <Link href="/talep"
        className="flex items-center justify-between bg-[#1a4f8a] text-white rounded-2xl p-4 mb-5">
        <div>
          <p className="font-semibold text-[15px]">Yeni Talep Oluştur</p>
          <p className="text-white/70 text-xs mt-0.5">Belediyenize kolayca ulaşın</p>
        </div>
        <FilePlus size={28} className="text-white/80" />
      </Link>

      {/* Son talepler */}
      {sonTalepler.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-[15px]">Son Taleplerim</h3>
            <Link href="/taleplerim" className="text-xs text-[#1a4f8a] font-medium flex items-center gap-0.5">
              Tümü <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {sonTalepler.map((talep) => {
              const tip = TIP_META[talep.tip];
              const durum = DURUM_META[talep.durum];
              return (
                <Link
                  key={talep.id}
                  href={`/taleplerim/${talep.id}`}
                  className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-gray-100 active:bg-gray-50 block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tip.cls}`}>
                        {tip.label}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${durum.cls}`}>
                        {durum.icon} {durum.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-gray-800 truncate">{talep.baslik}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {talep.referansNo} · {formatDistanceToNow(new Date(talep.olusturmaTarihi), { addSuffix: true, locale: tr })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {sonTalepler.length === 0 && (
        <div className="text-center py-10">
          <FilePlus size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Henüz talep oluşturmadınız</p>
          <Link href="/talep"
            className="inline-block mt-4 px-6 py-2.5 bg-[#1a4f8a] text-white rounded-xl text-sm font-medium">
            İlk Talebi Oluştur
          </Link>
        </div>
      )}
    </div>
  );
}