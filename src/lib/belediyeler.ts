export interface BelediyeInfo {
  id: string;
  ad: string;
  email: string;
  il: string;
  ilce: string;
}

export const BELEDIYELER: BelediyeInfo[] = [
  {
    id: 'salihli',
    ad: 'Salihli Belediyesi',
    email: 'info@salihli.bel.tr',
    il: 'Manisa',
    ilce: 'Salihli',
  },
  {
    id: 'yunusemre',
    ad: 'Yunusemre Belediyesi',
    email: 'bilgi@yunusemre.bel.tr',
    il: 'Manisa',
    ilce: 'Yunusemre',
  },
  {
    id: 'sehitkamil',
    ad: 'Şehitkamil Belediyesi',
    email: 'belediye@sehitkamil.bel.tr',
    il: 'Gaziantep',
    ilce: 'Şehitkamil',
  },
  {
    id: 'cankaya',
    ad: 'Çankaya Belediyesi',
    email: 'iletisimmerkezi@cankaya.bel.tr',
    il: 'Ankara',
    ilce: 'Çankaya',
  },
];
