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

  // Arama filtresi
  const filtreliSikayetler = sikayetler.filter(s =>
    s.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    s.detay.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    s.belediye.ad.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  return (
    <div className="px-4 pb-8">
      {/* Sayfa Başlığı */}
      <div className="flex items-center gap-2.5 pt-5 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
          <Megaphone size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Şikayetler</h2>
          <p className="text-xs text-gray-500">Ortak şikayetleri inceleyin ve kendi belediyenize iletin</p>
        </div>
      </div>

      {/* Arama Barı */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          placeholder="Şikayet başlığı veya belediye ara..."
          className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                     focus:border-[#1a4f8a] focus:bg-white transition-colors"
        />
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
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:bg-gray-50 
                         hover:border-gray-200 hover:shadow transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Building2 size={13} className="text-[#1a4f8a]" />
                    <span className="font-semibold text-[#1a4f8a]">{sikayet.belediye.ad}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${durum.cls}`}>
                    {durum.icon} {durum.label}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1.5">{sikayet.baslik}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{sikayet.detay}</p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <User size={12} />
                  <span>{maskeAdSoyad(sikayet.kullanici?.adSoyad)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDistanceToNow(new Date(sikayet.olusturmaTarihi), { addSuffix: true, locale: tr })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Şikayet Detay ve İletme Modalı */}
      {secilenSikayet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white w-full max-w-[400px] rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <Megaphone size={16} />
                </div>
                <span className="text-xs font-semibold text-gray-400">Şikayet Detayı</span>
              </div>
              <button 
                onClick={() => setSecilenSikayet(null)} 
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#1a4f8a] mb-1">
                  <Building2 size={13} />
                  <span>{secilenSikayet.belediye.ad}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">{secilenSikayet.baslik}</h3>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{secilenSikayet.detay}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                <div>
                  <p className="text-gray-400">Oluşturan Kullanıcı</p>
                  <p className="font-semibold text-gray-700">{maskeAdSoyad(secilenSikayet.kullanici?.adSoyad)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Oluşturma Tarihi</p>
                  <p className="font-semibold text-gray-700">
                    {new Date(secilenSikayet.olusturmaTarihi).toLocaleDateString('tr-TR', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>

              {/* Bilgilendirme Notu */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed">
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
                className="flex-1 py-3 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => handleSikayetIlet(secilenSikayet)}
                disabled={iletiliyor}
                className="flex-1.5 flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm 
                           flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
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
