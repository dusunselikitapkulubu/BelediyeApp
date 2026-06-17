'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { User, MapPin, Building2, Save, LogOut, CheckCircle, Edit2 } from 'lucide-react';
import { useAuthStore } from '@/store';
import { BELEDIYELER } from '@/lib/belediyeler';
import toast from 'react-hot-toast';

interface ProfilFormValues {
  adSoyad: string;
  tcKimlikNo: string;
  telefon: string;
  email: string;
  belediyeId: string;
  il: string;
  ilce: string;
  mahalle: string;
  caddeSokak: string;
  disKapiNo: string;
  icKapiNo: string;
}

export default function ProfilPage() {
  const router = useRouter();
  const { kullanici, updateKullanici, logout } = useAuthStore();
  const { data: session } = useSession();
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProfilFormValues>({
    defaultValues: {
      adSoyad: kullanici?.adSoyad || '',
      tcKimlikNo: kullanici?.tcKimlikNo || '',
      telefon: kullanici?.telefon || '',
      email: kullanici?.email || session?.user?.email || '',
      belediyeId: kullanici?.belediye?.id || 'salihli',
      il: kullanici?.adres?.il || 'Manisa',
      ilce: kullanici?.adres?.ilce || 'Salihli',
      mahalle: kullanici?.adres?.mahalle || '',
      caddeSokak: kullanici?.adres?.caddeSokak || '',
      disKapiNo: kullanici?.adres?.disKapiNo || '',
      icKapiNo: kullanici?.adres?.icKapiNo || '',
    }
  });

  const secilenBelediyeId = watch('belediyeId');

  // Kullanıcı yüklendiğinde veya değiştiğinde form değerlerini güncelle
  useEffect(() => {
    if (kullanici) {
      reset({
        adSoyad: kullanici.adSoyad || '',
        tcKimlikNo: kullanici.tcKimlikNo || '',
        telefon: kullanici.telefon || '',
        email: kullanici.email || session?.user?.email || '',
        belediyeId: kullanici.belediye?.id || 'salihli',
        il: kullanici.adres?.il || 'Manisa',
        ilce: kullanici.adres?.ilce || 'Salihli',
        mahalle: kullanici.adres?.mahalle || '',
        caddeSokak: kullanici.adres?.caddeSokak || '',
        disKapiNo: kullanici.adres?.disKapiNo || '',
        icKapiNo: kullanici.adres?.icKapiNo || '',
      });
    }
  }, [kullanici, session, reset]);

  // Belediye değiştiğinde İl ve İlçe bilgilerini otomatik güncelle
  useEffect(() => {
    if (secilenBelediyeId) {
      const belediye = BELEDIYELER.find(b => b.id === secilenBelediyeId);
      if (belediye) {
        setValue('il', belediye.il);
        setValue('ilce', belediye.ilce);
      }
    }
  }, [secilenBelediyeId, setValue]);

  useEffect(() => {
    if (!kullanici && !session?.user) {
      router.push('/giris');
    }
  }, [kullanici, session, router]);

  if (!kullanici && !session?.user) return null;

  const onSubmit = async (data: ProfilFormValues) => {
    setKaydediliyor(true);
    try {
      const selectedBelediye = BELEDIYELER.find(b => b.id === data.belediyeId) || BELEDIYELER[0];

      // Profil bilgilerini güncelle
      const guncellenmisBilgiler = {
        adSoyad: data.adSoyad,
        tcKimlikNo: data.tcKimlikNo,
        telefon: data.telefon,
        email: data.email,
        adres: {
          il: data.il,
          ilce: data.ilce,
          mahalle: data.mahalle,
          caddeSokak: data.caddeSokak,
          disKapiNo: data.disKapiNo,
          icKapiNo: data.icKapiNo,
        },
        belediye: {
          id: selectedBelediye.id,
          ad: selectedBelediye.ad,
          il: selectedBelediye.il,
          ilce: selectedBelediye.ilce,
        }
      };

      updateKullanici(guncellenmisBilgiler);

      // Simüle gecikme
      await new Promise(r => setTimeout(r, 800));

      toast.success('Profil bilgileriniz başarıyla güncellendi!');
      setIsEditing(false);
    } catch {
      toast.error('Profil güncellenirken hata oluştu.');
    } finally {
      setKaydediliyor(false);
    }
  };

  const handleLogout = async () => {
    logout();
    if (session) {
      await signOut({ callbackUrl: '/giris' });
    } else {
      router.push('/giris');
    }
  };

  return (
    <div className="px-4 pb-10">
      {/* Sayfa Başlığı */}
      <div className="flex items-center justify-between pt-5 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1a4f8a]">
            <User size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profilim</h2>
            <p className="text-xs text-gray-500">Şikayetlerinizde otomatik dolacak bilgileri yönetin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          type="button"
          className="p-2 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Çıkış Yap"
        >
          <LogOut size={16} />
          <span>Çıkış</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Bölüm 1: Kişisel Bilgiler */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-50">
            <User size={16} className="text-[#1a4f8a]" />
            <h3 className="text-sm font-bold text-gray-800">Kişisel Bilgiler</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Ad Soyad</label>
            <input
              {...register('adSoyad', { required: 'Ad soyad zorunludur' })}
              type="text"
              readOnly={!isEditing}
              className={`w-full h-11 px-3.5 border rounded-xl text-sm transition-all duration-200 ${isEditing
                ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a]'
                : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none'
                }`}
            />
            {errors.adSoyad && <p className="text-xs text-red-500 mt-1">{errors.adSoyad.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">TC Kimlik No</label>
              <input
                {...register('tcKimlikNo', {
                  required: 'TC Kimlik No zorunludur',
                  pattern: { value: /^[0-9]{11}$/, message: '11 haneli olmalıdır' }
                })}
                type="text"
                maxLength={11}
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border rounded-xl text-sm transition-all duration-200 ${isEditing
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a]'
                  : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none'
                  }`}
              />
              {errors.tcKimlikNo && <p className="text-xs text-red-500 mt-1">{errors.tcKimlikNo.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Telefon</label>
              <input
                {...register('telefon', { required: 'Telefon zorunludur' })}
                type="tel"
                placeholder="05xx xxx xx xx"
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border rounded-xl text-sm transition-all duration-200 ${isEditing
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a]'
                  : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none'
                  }`}
              />
              {errors.telefon && <p className="text-xs text-red-500 mt-1">{errors.telefon.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">E-posta</label>
            <input
              {...register('email')}
              type="email"
              readOnly
              className="w-full h-11 px-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Bölüm 2: Belediye Tercihi */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-50">
            <Building2 size={16} className="text-[#1a4f8a]" />
            <h3 className="text-sm font-bold text-gray-800">Varsayılan Belediye</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">İlgili Belediye</label>
            <select
              {...register('belediyeId', { required: 'Belediye seçimi zorunludur' })}
              disabled={!isEditing}
              className={`w-full h-11 px-3 border rounded-xl text-sm transition-all duration-200 ${isEditing
                ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a] cursor-pointer'
                : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none appearance-none'
                }`}
            >
              {BELEDIYELER.map((belediye) => (
                <option key={belediye.id} value={belediye.id}>
                  {belediye.ad} ({belediye.il} - {belediye.ilce})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bölüm 3: Adres Bilgileri */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-50">
            <MapPin size={16} className="text-[#1a4f8a]" />
            <h3 className="text-sm font-bold text-gray-800">Adres Bilgileri</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">İl</label>
              <input
                {...register('il')}
                type="text"
                readOnly
                className="w-full h-11 px-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">İlçe</label>
              <input
                {...register('ilce')}
                type="text"
                readOnly
                className="w-full h-11 px-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mahalle</label>
            <input
              {...register('mahalle', { required: 'Mahalle zorunludur' })}
              type="text"
              placeholder="Ör: Cumhuriyet Mah."
              readOnly={!isEditing}
              className={`w-full h-11 px-3.5 border rounded-xl text-sm transition-all duration-200 ${isEditing
                ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a]'
                : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none'
                }`}
            />
            {errors.mahalle && <p className="text-xs text-red-500 mt-1">{errors.mahalle.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cadde / Sokak</label>
            <input
              {...register('caddeSokak', { required: 'Cadde/Sokak zorunludur' })}
              type="text"
              placeholder="Ör: Atatürk Cad."
              readOnly={!isEditing}
              className={`w-full h-11 px-3.5 border rounded-xl text-sm transition-all duration-200 ${isEditing
                ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a]'
                : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none'
                }`}
            />
            {errors.caddeSokak && <p className="text-xs text-red-500 mt-1">{errors.caddeSokak.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Dış Kapı No</label>
              <input
                {...register('disKapiNo', { required: 'Dış kapı no zorunludur' })}
                type="text"
                placeholder="Ör: 12"
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border rounded-xl text-sm transition-all duration-200 ${isEditing
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a]'
                  : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none'
                  }`}
              />
              {errors.disKapiNo && <p className="text-xs text-red-500 mt-1">{errors.disKapiNo.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">İç Kapı No</label>
              <input
                {...register('icKapiNo')}
                type="text"
                placeholder="Ör: 3 (İsteğe bağlı)"
                readOnly={!isEditing}
                className={`w-full h-11 px-3.5 border rounded-xl text-sm transition-all duration-200 ${isEditing
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-[#1a4f8a]'
                  : 'bg-gray-50/70 border-gray-100 text-gray-500 cursor-default focus:outline-none'
                  }`}
              />
            </div>
          </div>
        </div>

        {/* Butonlar Grubu */}
        <div>
          {isEditing ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (kullanici) {
                    reset({
                      adSoyad: kullanici.adSoyad || '',
                      tcKimlikNo: kullanici.tcKimlikNo || '',
                      telefon: kullanici.telefon || '',
                      email: kullanici.email || session?.user?.email || '',
                      belediyeId: kullanici.belediye?.id || 'salihli',
                      il: kullanici.adres?.il || 'Manisa',
                      ilce: kullanici.adres?.ilce || 'Salihli',
                      mahalle: kullanici.adres?.mahalle || '',
                      caddeSokak: kullanici.adres?.caddeSokak || '',
                      disKapiNo: kullanici.adres?.disKapiNo || '',
                      icKapiNo: kullanici.adres?.icKapiNo || '',
                    });
                  }
                  setIsEditing(false);
                }}
                disabled={kaydediliyor}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all duration-200"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={kaydediliyor}
                className="flex-1 h-12 bg-[#1a4f8a] hover:bg-[#123968] active:scale-[0.99] text-white rounded-xl font-semibold text-sm 
                           flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {kaydediliyor ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full h-12 bg-[#1a4f8a] hover:bg-[#123968] active:scale-[0.99] text-white rounded-xl font-semibold text-sm 
                         flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Edit2 size={16} />
              <span>Profil Bilgilerini Düzenle</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
