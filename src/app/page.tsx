'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FilePlus, MapPin, CheckCircle2, Clock, AlertCircle,
  ChevronRight, ShieldCheck,
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
  const { kullanici } = useAuthStore();
  const { talepler, setTalepler } = useTalepStore();

  useEffect(() => {
    if (!kullanici) { router.push('/giris'); return; }
    talepAPI.liste({ sayfa: 1 })
      .then((r) => setTalepler(r.data.items))
      .catch(() => { });
  }, [kullanici, router, setTalepler]);

  if (!kullanici) return null;

  const sonTalepler = talepler.slice(0, 3);
  const tamamlananSayi = talepler.filter((t) => t.durum === 'tamamlandi').length;
  const bekleyenSayi = talepler.filter((t) => t.durum === 'bekliyor' || t.durum === 'isleniyor').length;

  return (
    <div className="px-4 pb-8">

      {/* Karşılama */}
      <div className="pt-5 pb-4">
        <p className="text-sm text-gray-500">Merhaba,</p>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{kullanici.adSoyad}</h2>
          {kullanici.edevletDogrulandi && (
            <span className="flex items-center gap-1 text-[11px] text-green-700 bg-green-50 px-2 py-1 rounded-full">
              <ShieldCheck size={12} /> e-Devlet
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500">{kullanici.belediye?.ad || 'Belediye belirlenmedi'}</span>
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