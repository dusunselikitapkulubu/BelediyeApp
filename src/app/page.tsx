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
  const { talepler, setTalepler, setYukleniyor } = useTalepStore();
  const { data: session } = useSession();

  useEffect(() => {
    if (!kullanici && !session?.user) { router.push('/giris'); return; }
    setYukleniyor(true);
    talepAPI.liste({ sayfa: 1 })
      .then((r) => setTalepler(r.data.items))
      .catch((err) => {
        console.error('Talepler yüklenirken hata:', err);
      });
  }, [kullanici, session, router, setTalepler, setYukleniyor]);

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
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Merhaba,</p>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-2">
            {isGoogle && session?.user?.image && (
              <img
                src={session.user.image}
                alt={displayName}
                className="w-8 h-8 rounded-full ring-2 ring-blue-50"
                referrerPolicy="no-referrer"
              />
            )}
            <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {isGoogle && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-0.5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </span>
            )}
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200" title="Çıkış Yap">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <MapPin size={13} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">{belediyeAd}</span>
          {displayEmail && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">{displayEmail}</span>
            </>
          )}
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-xs text-blue-600 font-bold mb-1">Bekleyen</p>
          <p className="text-3xl font-black text-blue-600">{bekleyenSayi}</p>
          <p className="text-[10px] text-blue-500/80 font-medium mt-1">talep işlemde</p>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-xs text-emerald-600 font-bold mb-1">Tamamlanan</p>
          <p className="text-3xl font-black text-emerald-600">{tamamlananSayi}</p>
          <p className="text-[10px] text-emerald-500/80 font-medium mt-1">talep çözüldü</p>
        </div>
      </div>

      {/* Yeni talep butonu */}
      <Link href="/talep"
        className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl p-5 mb-5 shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-200">
        <div>
          <p className="font-bold text-[16px] tracking-wide">Yeni Talep Oluştur</p>
          <p className="text-white/80 text-xs mt-1 font-medium">Belediyenize hızlıca ulaşın ve bildirim alın</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
          <FilePlus size={22} className="text-white" />
        </div>
      </Link>

      {/* Son talepler */}
      {sonTalepler.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-800 text-[15px]">Son Taleplerim</h3>
            <Link href="/taleplerim" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 hover:underline">
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
                  className="flex items-start gap-3 bg-white hover:border-slate-200 hover:shadow-sm rounded-2xl p-4 border border-slate-100 active:bg-slate-50 transition-all duration-200 block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tip.cls}`}>
                        {tip.label}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${durum.cls}`}>
                        {durum.icon} {durum.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-slate-800 truncate">{talep.baslik}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {talep.referansNo} · {formatDistanceToNow(new Date(talep.olusturmaTarihi), { addSuffix: true, locale: tr })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 mt-1 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {sonTalepler.length === 0 && (
        <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <FilePlus size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Henüz talep oluşturmadınız</p>
          <Link href="/talep"
            className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200 active:scale-95">
            İlk Talebi Oluştur
          </Link>
        </div>
      )}
    </div>
  );
}