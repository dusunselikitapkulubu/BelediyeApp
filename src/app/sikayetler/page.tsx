'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Megaphone, Search, Building2, MapPin, User, Calendar, 
  X, Send, Clock, CheckCircle2, AlertCircle, ChevronRight, FileText, ArrowRight
} from 'lucide-react';
import { useAuthStore, useTalepStore } from '@/store';
import { talepAPI } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import type { Talep, TalepDurumu } from '@/types';

const DURUM_META: Record<TalepDurumu, { label: string; icon: React.ReactNode; cls: string }> = {
  bekliyor: { label: 'Bekliyor', icon: <Clock size={11} />, cls: 'durum-bekliyor' },
  isleniyor: { label: 'İşleniyor', icon: <Clock size={11} />, cls: 'durum-isleniyor' },
  'bekleyen-bilgi': { label: 'Bilgi Bekleniyor', icon: <AlertCircle size={11} />, cls: 'durum-bekliyor' },
  tamamlandi: { label: 'Tamamlandı', icon: <CheckCircle2 size={11} />, cls: 'durum-tamamlandi' },
  reddedildi: { label: 'Reddedildi', icon: <AlertCircle size={11} />, cls: 'durum-reddedildi' },
};

// İsimleri KVKK kurallarına göre maskeleme: "Ahmet Yılmaz" -> "Ahmet Y***"
function maskeAdSoyad(adSoyad: string) {
  if (!adSoyad) return 'Gizli Kullanıcı';
  const parcalar = adSoyad.split(' ');
  if (parcalar.length === 1) {
    return parcalar[0].substring(0, 2) + '***';
  }
  const ad = parcalar.slice(0, -1).join(' ');
  const soyad = parcalar[parcalar.length - 1];
  return `${ad} ${soyad.substring(0, 1)}***`;
}

export default function SikayetlerPage() {
  const router = useRouter();
  const { kullanici } = useAuthStore();
  const { data: session } = useSession();
  const { addTalep } = useTalepStore();

  const [sikayetler, setSikayetler] = useState<Talep[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenIl, setSecilenIl] = useState<string>('');
  const [secilenIlce, setSecilenIlce] = useState<string>('');
  const [secilenSikayet, setSecilenSikayet] = useState<Talep | null>(null);
  const [iletiliyor, setIletiliyor] = useState(false);

  // Verileri API'den çek
  const veriYukle = async () => {
    try {
      setYukleniyor(true);
      const res = await fetch('/api/talep?tip=sikayet');
      const data = await res.json();
      if (data.items) {
        setSikayetler(data.items);
      }
    } catch (err) {
      console.error('Şikayetler yüklenirken hata:', err);
      toast.error('Şikayetler yüklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    if (!kullanici && !session?.user) {
      router.push('/giris');
      return;
    }
    veriYukle();
  }, [kullanici, session, router]);

  if (!kullanici && !session?.user) return null;

  // Şikayeti kendi belediyesine iletme işlemi
  const handleSikayetIlet = async (sikayet: Talep) => {
    if (!kullanici) {
      toast.error('Kullanıcı bilgisi bulunamadı.');
      return;
    }

    setIletiliyor(true);
    try {
      // 1. E-posta API'sine gönder
      const emailResponse = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tip: 'sikayet',
          belediyeId: kullanici.belediye.id,
          baslik: sikayet.baslik,
          detay: sikayet.detay,
          fotografIds: [],
          yerBilgisi: {
            il: kullanici.adres.il || 'Manisa',
            ilce: kullanici.adres.ilce || 'Salihli',
            mahalle: kullanici.adres.mahalle || '',
            caddeSokak: kullanici.adres.caddeSokak || '',
            disKapiNo: kullanici.adres.disKapiNo || '',
            icKapiNo: kullanici.adres.icKapiNo || '',
          },
          kullaniciBilgileri: {
            adSoyad: kullanici.adSoyad,
            telefon: kullanici.telefon,
            email: kullanici.email || session?.user?.email || '',
          },
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'E-posta gönderilemedi');
      }

      // 2. Ayrıca yerel veritabanına kaydet
      const yeniTalep = {
        id: `local-${Date.now()}`,
        referansNo: emailResult.data.referansNo,
        tip: 'sikayet' as const,
        durum: 'bekliyor' as const,
        baslik: sikayet.baslik,
        detay: sikayet.detay,
        fotograflar: [],
        yerBilgisi: {
          il: kullanici.adres.il || 'Manisa',
          ilce: kullanici.adres.ilce || 'Salihli',
          mahalle: kullanici.adres.mahalle || '',
          caddeSokak: kullanici.adres.caddeSokak || '',
          disKapiNo: kullanici.adres.disKapiNo || '',
          icKapiNo: kullanici.adres.icKapiNo || '',
        },
        belediye: kullanici.belediye,
        kullanici: {
          adSoyad: kullanici.adSoyad,
          tcKimlikNo: kullanici.tcKimlikNo,
          telefon: kullanici.telefon,
          email: kullanici.email || session?.user?.email || '',
        },
        olusturmaTarihi: new Date().toISOString(),
        guncellemeTarihi: new Date().toISOString(),
      };

      await fetch('/api/talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yeniTalep),
      });

      // Zustand store'a da ekle
      addTalep(yeniTalep);
      
      toast.success('Şikayet kendi belediyenize başarıyla iletildi!');
      setSecilenSikayet(null);
      
      // Şikayetler listesini güncelle
      veriYukle();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Şikayet iletilemedi, lütfen tekrar deneyin.');
    } finally {
      setIletiliyor(false);
    }
  };

  // Benzersiz il ve ilçe listelerini çıkar
  const iller = Array.from(
    new Set(
      sikayetler
        .map((s) => s.yerBilgisi?.il || s.belediye?.il)
        .filter(Boolean)
    )
  ).sort() as string[];

  const ilceler = Array.from(
    new Set(
      sikayetler
        .filter((s) => !secilenIl || (s.yerBilgisi?.il || s.belediye?.il) === secilenIl)
        .map((s) => s.yerBilgisi?.ilce || s.belediye?.ilce)
        .filter(Boolean)
    )
  ).sort() as string[];

  // Arama, İl ve İlçe filtresi
  const filtreliSikayetler = sikayetler.filter((s) => {
    const aramaMetniEslesti =
      s.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      s.detay.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      s.belediye.ad.toLowerCase().includes(aramaMetni.toLowerCase());

    const il = s.yerBilgisi?.il || s.belediye?.il || '';
    const ilce = s.yerBilgisi?.ilce || s.belediye?.ilce || '';

    const ilEslesti = !secilenIl || il.toLowerCase() === secilenIl.toLowerCase();
    const ilceEslesti = !secilenIlce || ilce.toLowerCase() === secilenIlce.toLowerCase();

    return aramaMetniEslesti && ilEslesti && ilceEslesti;
  });

  return (
    <div className="px-4 pb-8">
      {/* Sayfa Başlığı */}
      <div className="flex items-center gap-3 pt-5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/10">
          <Megaphone size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Şikayetler</h2>
          <p className="text-xs text-slate-400 font-medium">Ortak şikayetleri inceleyin ve kendi belediyenize iletin</p>
        </div>
      </div>

      {/* Arama ve Filtre Bölümü */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-5 space-y-3">
        {/* Arama Barı */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="Şikayet başlığı veya belediye ara..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800
                       focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        {/* İl & İlçe Filtreleri */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">İl</label>
            <div className="relative">
              <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={secilenIl}
                onChange={(e) => {
                  setSecilenIl(e.target.value);
                  setSecilenIlce(''); // İl değişince ilçeyi sıfırla
                }}
                className="w-full h-9 pl-7 pr-7 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700
                           focus:border-blue-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="">Tüm İller</option>
                {iller.map(il => (
                  <option key={il} value={il}>{il}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">İlçe</label>
            <div className="relative">
              <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={secilenIlce}
                onChange={(e) => setSecilenIlce(e.target.value)}
                disabled={!secilenIl && ilceler.length === 0}
                className="w-full h-9 pl-7 pr-7 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700
                           focus:border-blue-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">Tüm İlçeler</option>
                {ilceler.map(ilce => (
                  <option key={ilce} value={ilce}>{ilce}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
            </div>
          </div>
        </div>

        {/* Hızlı Filtre ve Temizleme */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          {kullanici?.adres?.il ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Hızlı Filtre:</span>
              <button
                type="button"
                onClick={() => {
                  setSecilenIl(kullanici.adres.il);
                  setSecilenIlce(kullanici.adres.ilce || '');
                }}
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-200 flex items-center gap-1
                  ${secilenIl === kullanici.adres.il && secilenIlce === kullanici.adres.ilce
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                    : 'bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-100/60'
                  }`}
              >
                <MapPin size={10} />
                Bulunduğum Yer ({kullanici.adres.ilce ? `${kullanici.adres.ilce}, ` : ''}{kullanici.adres.il})
              </button>
            </div>
          ) : (
            <div />
          )}

          {(secilenIl || secilenIlce || aramaMetni) && (
            <button
              type="button"
              onClick={() => {
                setAramaMetni('');
                setSecilenIl('');
                setSecilenIlce('');
              }}
              className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 active:scale-95 transition-all ml-auto"
            >
              <X size={10} />
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Yükleniyor Durumu */}
      {yukleniyor && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-36" />
          ))}
        </div>
      )}

      {/* Boş Durum */}
      {!yukleniyor && filtreliSikayetler.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl p-6">
          <FileText size={44} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Şikayet Bulunamadı</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[250px] mx-auto">
            {aramaMetni ? 'Arama kriterlerinize uygun şikayet bulunmuyor.' : 'Henüz oluşturulmuş ortak şikayet kaydı bulunmuyor.'}
          </p>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3.5">
        {filtreliSikayetler.map((sikayet) => {
          const durum = DURUM_META[sikayet.durum];
          return (
            <div
              key={sikayet.id}
              onClick={() => setSecilenSikayet(sikayet)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:bg-slate-50 
                         hover:border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5 flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 size={13} className="text-blue-600" />
                    <span className="font-bold text-blue-600">{sikayet.belediye.ad}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${durum.cls}`}>
                    {durum.icon} {durum.label}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{sikayet.baslik}</h3>
                
                {/* Konum Bilgisi (İl ve İlçe Bölümlenmiş) */}
                <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-[10px] text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    <MapPin size={9} className="text-slate-400" />
                    <span className="font-bold text-slate-400 mr-0.5">İl:</span>
                    <span>{sikayet.yerBilgisi?.il || sikayet.belediye?.il || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-[10px] text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    <span className="font-bold text-slate-400 mr-0.5">İlçe:</span>
                    <span>{sikayet.yerBilgisi?.ilce || sikayet.belediye?.ilce || 'Belirtilmemiş'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed font-medium">{sikayet.detay}</p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  <span>{maskeAdSoyad(sikayet.kullanici?.adSoyad)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{formatDistanceToNow(new Date(sikayet.olusturmaTarihi), { addSuffix: true, locale: tr })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Şikayet Detay ve İletme Modalı */}
      {secilenSikayet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white w-full max-w-[400px] rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                  <Megaphone size={16} />
                </div>
                <span className="text-xs font-bold text-slate-400">Şikayet Detayı</span>
              </div>
              <button 
                onClick={() => setSecilenSikayet(null)} 
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1">
                  <Building2 size={13} />
                  <span>{secilenSikayet.belediye.ad}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 leading-snug">{secilenSikayet.baslik}</h3>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{secilenSikayet.detay}</p>
              </div>

              {/* Konum Bilgileri (İl ve İlçe Bölümlenmiş) */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                <div>
                  <p className="text-slate-400 font-medium">İl</p>
                  <p className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-rose-500" />
                    {secilenSikayet.yerBilgisi?.il || secilenSikayet.belediye?.il || 'Belirtilmemiş'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">İlçe</p>
                  <p className="font-bold text-slate-700 mt-0.5">
                    {secilenSikayet.yerBilgisi?.ilce || secilenSikayet.belediye?.ilce || 'Belirtilmemiş'}
                  </p>
                </div>
                {secilenSikayet.yerBilgisi?.mahalle && (
                  <div className="col-span-2 pt-1.5 border-t border-slate-200/50 mt-1">
                    <p className="text-slate-400 font-medium">Adres Bilgisi</p>
                    <p className="font-bold text-slate-700 mt-0.5">
                      {secilenSikayet.yerBilgisi.mahalle} 
                      {secilenSikayet.yerBilgisi.caddeSokak ? `, ${secilenSikayet.yerBilgisi.caddeSokak}` : ''}
                      {secilenSikayet.yerBilgisi.disKapiNo ? ` No: ${secilenSikayet.yerBilgisi.disKapiNo}` : ''}
                      {secilenSikayet.yerBilgisi.icKapiNo ? ` Daire: ${secilenSikayet.yerBilgisi.icKapiNo}` : ''}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                <div>
                  <p className="text-slate-400 font-medium">Oluşturan Kullanıcı</p>
                  <p className="font-bold text-slate-700 mt-0.5">{maskeAdSoyad(secilenSikayet.kullanici?.adSoyad)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Oluşturma Tarihi</p>
                  <p className="font-bold text-slate-700 mt-0.5">
                    {new Date(secilenSikayet.olusturmaTarihi).toLocaleDateString('tr-TR', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>

              {/* Bilgilendirme Notu */}
              <div className="bg-blue-50/70 border border-blue-100/60 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed font-medium">
                <h4 className="font-bold mb-1 flex items-center gap-1">
                  <AlertCircle size={14} className="text-blue-600" />
                  Kendi Belediyene İlet
                </h4>
                <p>
                  Bu şikayetin aynısı, kendi hesabınızda kayıtlı olan <strong>{kullanici?.belediye?.ad || 'belediyenize'}</strong> adınıza e-posta olarak iletilecektir.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSecilenSikayet(null)}
                className="flex-1 py-3 text-sm font-bold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => handleSikayetIlet(secilenSikayet)}
                disabled={iletiliyor}
                className="flex-1.5 flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white py-3 rounded-xl font-bold text-sm 
                           flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {iletiliyor ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>İletiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Belediyeme İlet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
