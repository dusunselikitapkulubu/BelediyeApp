class Adres {
  final String il;
  final String ilce;
  final String mahalle;
  final String caddeSokak;
  final String disKapiNo;
  final String icKapiNo;

  Adres({
    required this.il,
    required this.ilce,
    required this.mahalle,
    required this.caddeSokak,
    required this.disKapiNo,
    required this.icKapiNo,
  });

  factory Adres.fromJson(Map<String, dynamic> json) {
    return Adres(
      il: json['il'] ?? '',
      ilce: json['ilce'] ?? '',
      mahalle: json['mahalle'] ?? '',
      caddeSokak: json['caddeSokak'] ?? '',
      disKapiNo: json['disKapiNo'] ?? '',
      icKapiNo: json['icKapiNo'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'il': il,
        'ilce': ilce,
        'mahalle': mahalle,
        'caddeSokak': caddeSokak,
        'disKapiNo': disKapiNo,
        'icKapiNo': icKapiNo,
      };
}

class Belediye {
  final String id;
  final String ad;
  final String il;
  final String ilce;
  final String? logo;

  Belediye({
    required this.id,
    required this.ad,
    required this.il,
    required this.ilce,
    this.logo,
  });

  factory Belediye.fromJson(Map<String, dynamic> json) {
    return Belediye(
      id: json['id'] ?? '',
      ad: json['ad'] ?? '',
      il: json['il'] ?? '',
      ilce: json['ilce'] ?? '',
      logo: json['logo'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ad': ad,
        'il': il,
        'ilce': ilce,
        'logo': logo,
      };
}

class Kullanici {
  final String id;
  final String adSoyad;
  final String tcKimlikNo;
  final String telefon;
  final String email;
  final Adres adres;
  final Belediye belediye;

  Kullanici({
    required this.id,
    required this.adSoyad,
    required this.tcKimlikNo,
    required this.telefon,
    required this.email,
    required this.adres,
    required this.belediye,
  });

  factory Kullanici.fromJson(Map<String, dynamic> json) {
    return Kullanici(
      id: json['id'] ?? '',
      adSoyad: json['adSoyad'] ?? '',
      tcKimlikNo: json['tcKimlikNo'] ?? '',
      telefon: json['telefon'] ?? '',
      email: json['email'] ?? '',
      adres: Adres.fromJson(json['adres'] ?? {}),
      belediye: Belediye.fromJson(json['belediye'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'adSoyad': adSoyad,
        'tcKimlikNo': tcKimlikNo,
        'telefon': telefon,
        'email': email,
        'adres': adres.toJson(),
        'belediye': belediye.toJson(),
      };
}

class TalepYerBilgisi {
  final String il;
  final String ilce;
  final String mahalle;
  final String caddeSokak;
  final String disKapiNo;
  final String icKapiNo;

  TalepYerBilgisi({
    required this.il,
    required this.ilce,
    required this.mahalle,
    required this.caddeSokak,
    required this.disKapiNo,
    required this.icKapiNo,
  });

  factory TalepYerBilgisi.fromJson(Map<String, dynamic> json) {
    return TalepYerBilgisi(
      il: json['il'] ?? '',
      ilce: json['ilce'] ?? '',
      mahalle: json['mahalle'] ?? '',
      caddeSokak: json['caddeSokak'] ?? '',
      disKapiNo: json['disKapiNo'] ?? '',
      icKapiNo: json['icKapiNo'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'il': il,
        'ilce': ilce,
        'mahalle': mahalle,
        'caddeSokak': caddeSokak,
        'disKapiNo': disKapiNo,
        'icKapiNo': icKapiNo,
      };
}

class Talep {
  final String id;
  final String referansNo;
  final String tip;
  final String durum;
  final String baslik;
  final String detay;
  final List<dynamic> fotograflar;
  final TalepYerBilgisi yerBilgisi;
  final Belediye belediye;
  final Map<String, dynamic> kullanici;
  final String? yanit;
  final String olusturmaTarihi;
  final String guncellemeTarihi;

  Talep({
    required this.id,
    required this.referansNo,
    required this.tip,
    required this.durum,
    required this.baslik,
    required this.detay,
    required this.fotograflar,
    required this.yerBilgisi,
    required this.belediye,
    required this.kullanici,
    this.yanit,
    required this.olusturmaTarihi,
    required this.guncellemeTarihi,
  });

  factory Talep.fromJson(Map<String, dynamic> json) {
    return Talep(
      id: json['id'] ?? '',
      referansNo: json['referansNo'] ?? '',
      tip: json['tip'] ?? 'sikayet',
      durum: json['durum'] ?? 'bekliyor',
      baslik: json['baslik'] ?? '',
      detay: json['detay'] ?? '',
      fotograflar: json['fotograflar'] ?? [],
      yerBilgisi: TalepYerBilgisi.fromJson(json['yerBilgisi'] ?? {}),
      belediye: Belediye.fromJson(json['belediye'] ?? {}),
      kullanici: Map<String, dynamic>.from(json['kullanici'] ?? {}),
      yanit: json['yanit'],
      olusturmaTarihi: json['olusturmaTarihi'] ?? '',
      guncellemeTarihi: json['guncellemeTarihi'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'referansNo': referansNo,
        'tip': tip,
        'durum': durum,
        'baslik': baslik,
        'detay': detay,
        'fotograflar': fotograflar,
        'yerBilgisi': yerBilgisi.toJson(),
        'belediye': belediye.toJson(),
        'kullanici': kullanici,
        'yanit': yanit,
        'olusturmaTarihi': olusturmaTarihi,
        'guncellemeTarihi': guncellemeTarihi,
      };
}
