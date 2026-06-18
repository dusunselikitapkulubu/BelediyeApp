'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Filter, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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
  bekliyor: { label: 'Bekliyor', icon: <Clock size={11} />, cls: 'durum-bekliyor' },
  isleniyor: { label: 'İşleniyor', icon: <Clock size={11} />, cls: 'durum-isleniyor' },
  'bekleyen-bilgi': { label: 'Bilgi Bekleniyor', icon: <AlertCircle size={11} />, cls: 'durum-bekliyor' },
  tamamlandi: { label: 'Tamamlandı', icon: <CheckCircle2 size={11} />, cls: 'durum-tamamlandi' },
  reddedildi: { label: 'Reddedildi', icon: <AlertCircle size={11} />, cls: 'durum-reddedildi' },
};

const DURUM_FILTRELER = [
  { value: '', label: 'Tümü' },
  { value: 'bekliyor', label: 'Bekliyor' },
  { value: 'isleniyor', label: 'İşleniyor' },
  { value: 'tamamlandi', label: 'Tamamlandı' },
];

export default function TaleplerimPage() {
  const router = useRouter();
  const { kullanici } = useAuthStore();
  const { talepler, setTalepler, yukleniyor } = useTalepStore();
  const [aramaMetni, setAramaMetni] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');

  useEffect(() => {
    if (!kullanici) { router.push('/giris'); return; }
    talepAPI.liste()
      .then((r) => setTalepler(r.data.items))
      .catch((err) => {
        console.error('Talepler yüklenirken hata:', err);
      });
  }, [kullanici, router, setTalepler]);

  const filtreliTalepler = talepler.filter((t) => {
    const aramaUyuyor = !aramaMetni ||
      t.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      t.referansNo.toLowerCase().includes(aramaMetni.toLowerCase());
    const durumUyuyor = !durumFiltre || t.durum === durumFiltre;
    return aramaUyuyor && durumUyuyor;
  });

  if (!kullanici) return null;

  return (
    <div className="px-4 pb-8">
      <h2 className="text-xl font-bold text-gray-900 pt-5 mb-4">Taleplerim</h2>

      {/* Arama */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          placeholder="Ara (başlık veya referans no)..."
          className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                     focus:border-[#1a4f8a] focus:bg-white transition-colors"
        />
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {DURUM_FILTRELER.map((f) => (
          <button
            key={f.value}
            onClick={() => setDurumFiltre(f.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors
              ${durumFiltre === f.value
                ? 'bg-[#1a4f8a] text-white'
                : 'bg-gray-100 text-gray-600'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {yukleniyor && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-24" />
          ))}
        </div>
      )}

      {!yukleniyor && filtreliTalepler.length === 0 && (
        <div className="text-center py-16">
          <Filter size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {aramaMetni || durumFiltre ? 'Sonuç bulunamadı' : 'Henüz talep oluşturmadınız'}
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {filtreliTalepler.map((talep) => {
          const tip = TIP_META[talep.tip];
          const durum = DURUM_META[talep.durum];
          return (
            <Link
              key={talep.id}
              href={`/taleplerim/${talep.id}`}
              className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-gray-100 active:bg-gray-50 block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tip.cls}`}>
                    {tip.label}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${durum.cls}`}>
                    {durum.icon} {durum.label}
                  </span>
                </div>
                <p className="text-[14px] font-semibold text-gray-800 truncate">{talep.baslik}</p>
                <p className="text-[12px] text-gray-500 mt-0.5 truncate">{talep.detay}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-gray-400">{talep.referansNo}</span>
                  <span className="text-[11px] text-gray-400">
                    {formatDistanceToNow(new Date(talep.olusturmaTarihi), { addSuffix: true, locale: tr })}
                  </span>
                  {talep.fotograflar?.length > 0 && (
                    <span className="text-[11px] text-gray-400">📷 {talep.fotograflar.length}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
