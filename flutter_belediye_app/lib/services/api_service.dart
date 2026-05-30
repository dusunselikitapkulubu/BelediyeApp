import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  // Geliştirme ortamında localhost, emulator için 10.0.2.2 kullanılmalıdır
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  
  Kullanici? _currentUser;
  Kullanici? get currentUser => _currentUser;

  // Mock Giriş
  Future<Kullanici> loginWithEDevlet(String tcKimlikNo) async {
    // Demo amacıyla e-devlet doğrulandı kabul edilip mock kullanıcı döner.
    final mockUser = Kullanici(
      id: 'usr-123',
      adSoyad: 'Ahmet Yılmaz',
      tcKimlikNo: tcKimlikNo,
      telefon: '0532 123 4567',
      email: 'ahmet.yilmaz@email.com',
      adres: Adres(
        il: 'Manisa',
        ilce: 'Salihli',
        mahalle: 'Cumhuriyet Mah.',
        caddeSokak: 'Atatürk Cad.',
        disKapiNo: '45',
        icKapiNo: '3',
      ),
      belediye: Belediye(
        id: 'salihli',
        ad: 'Salihli Belediyesi',
        il: 'Manisa',
        ilce: 'Salihli',
      ),
    );

    _currentUser = mockUser;
    
    // SharedPreferences'a kaydet
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('kullanici', jsonEncode(mockUser.toJson()));
    
    return mockUser;
  }

  Future<void> logout() async {
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('kullanici');
  }

  Future<bool> checkSession() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('kullanici');
    if (cached != null) {
      _currentUser = Kullanici.fromJson(jsonDecode(cached));
      return true;
    }
    return false;
  }

  // Profil Güncelleme
  Future<Kullanici> updateProfile(Kullanici updatedUser) async {
    _currentUser = updatedUser;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('kullanici', jsonEncode(updatedUser.toJson()));
    return updatedUser;
  }

  // Şikayetleri Listele
  Future<List<Talep>> getSikayetler({String? tip}) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/talep?tip=sikayet')).timeout(
        const Duration(seconds: 3),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List items = data['items'] ?? [];
        return items.map((item) => Talep.fromJson(item)).toList();
      }
    } catch (e) {
      print('API Error: $e, mock verilere dönülüyor...');
    }

    // Fallback Mock Data
    return _getMockTalepler().where((t) => tip == null || t.tip == tip).toList();
  }

  // Talep Oluştur
  Future<Talep> createTalep({
    required String tip,
    required String baslik,
    required String detay,
    required String mahalle,
    required String caddeSokak,
    required String disKapiNo,
    required String icKapiNo,
  }) async {
    if (_currentUser == null) throw Exception('Giriş yapılmamış');

    final yeniTalep = {
      'tip': tip,
      'baslik': baslik,
      'detay': detay,
      'fotograflar': [],
      'yerBilgisi': {
        'il': _currentUser!.adres.il,
        'ilce': _currentUser!.adres.ilce,
        'mahalle': mahalle,
        'caddeSokak': caddeSokak,
        'disKapiNo': disKapiNo,
        'icKapiNo': icKapiNo,
      },
      'belediye': _currentUser!.belediye.toJson(),
      'kullanici': {
        'adSoyad': _currentUser!.adSoyad,
        'tcKimlikNo': _currentUser!.tcKimlikNo,
        'telefon': _currentUser!.telefon,
        'email': _currentUser!.email,
      },
    };

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/talep'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(yeniTalep),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final resData = jsonDecode(response.body);
        if (resData['success'] == true) {
          return Talep.fromJson(resData['data']);
        }
      }
    } catch (e) {
      print('API POST Error: $e, localde oluşturuluyor...');
    }

    // Local Fallback
    final localTalep = Talep.fromJson({
      'id': 'local-${DateTime.now().millisecondsSinceEpoch}',
      'referansNo': 'BLD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      ...yeniTalep,
      'durum': 'bekliyor',
      'olusturmaTarihi': DateTime.now().toUtc().toIso8601String(),
      'guncellemeTarihi': DateTime.now().toUtc().toIso8601String(),
    });

    // Mock kayıt listesine ekle
    _mockTalepler.insert(0, localTalep);
    return localTalep;
  }

  // Kullanıcı Talepleri
  Future<List<Talep>> getKullaniciTalepleri() async {
    if (_currentUser == null) return [];
    
    try {
      // API'ye Header ile Authorization token gönderilebilir
      final response = await http.get(
        Uri.parse('$baseUrl/talep'),
        headers: {'Authorization': 'Bearer mock-token-123'},
      ).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List items = data['items'] ?? [];
        return items.map((item) => Talep.fromJson(item)).toList();
      }
    } catch (e) {
      print('API Error: $e, local verilere dönülüyor...');
    }

    return _mockTalepler.where((t) => t.kullanici['email'] == _currentUser!.email).toList();
  }

  // --- Mock Veritabanı ---
  final List<Talep> _mockTalepler = _getMockTalepler();

  static List<Talep> _getMockTalepler() {
    return [
      Talep(
        id: 'complaint-1',
        referansNo: 'BLD-K8S2J9-F3A1',
        tip: 'sikayet',
        durum: 'bekliyor',
        baslik: 'Sokak Lambası Arızası',
        detay: 'Cumhuriyet Mahallesi Atatürk Caddesi üzerinde bulunan 3 adet sokak lambası yaklaşık bir haftadır yanmıyor. Akşamları sokak çok karanlık oluyor ve güvenlik riski oluşturuyor. Tamir edilmesini talep ediyorum.',
        fotograflar: [],
        yerBilgisi: TalepYerBilgisi(
          il: 'Manisa',
          ilce: 'Salihli',
          mahalle: 'Cumhuriyet Mah.',
          caddeSokak: 'Atatürk Cad.',
          disKapiNo: '45',
          icKapiNo: '',
        ),
        belediye: Belediye(id: 'salihli', ad: 'Salihli Belediyesi', il: 'Manisa', ilce: 'Salihli'),
        kullanici: {'adSoyad': 'Mehmet Demir', 'email': 'mehmet.demir@email.com'},
        olusturmaTarihi: '2026-05-25T14:30:00.000Z',
        guncellemeTarihi: '2026-05-25T14:30:00.000Z',
      ),
      Talep(
        id: 'complaint-2',
        referansNo: 'BLD-M4P8X1-Y7Z2',
        tip: 'sikayet',
        durum: 'isleniyor',
        baslik: 'Çöp Konteyneri Yetersizliği',
        detay: 'Mithatpaşa Mahallesi 24. Sokak\'ta çöp konteynerleri yetersiz kalıyor. Çöpler dışarı taşıyor ve çevreye kötü koku yayılıyor. Yeni bir konteyner konulmasını rica ederim.',
        fotograflar: [],
        yerBilgisi: TalepYerBilgisi(
          il: 'Manisa',
          ilce: 'Salihli',
          mahalle: 'Mithatpaşa Mah.',
          caddeSokak: '24. Sokak',
          disKapiNo: '12',
          icKapiNo: '',
        ),
        belediye: Belediye(id: 'salihli', ad: 'Salihli Belediyesi', il: 'Manisa', ilce: 'Salihli'),
        kullanici: {'adSoyad': 'Zeynep Kaya', 'email': 'zeynep.kaya@email.com'},
        olusturmaTarihi: '2026-05-22T09:15:00.000Z',
        guncellemeTarihi: '2026-05-22T11:00:00.000Z',
      ),
      Talep(
        id: 'complaint-3',
        referansNo: 'BLD-L2T5H9-W8V4',
        tip: 'sikayet',
        durum: 'tamamlandi',
        baslik: 'Yol Çökmesi ve Çukur',
        detay: 'Kurtuluş Mahallesi Gençlik Caddesi\'ndeki kavşakta derin bir çukur oluşmuş durumda. Araçlar geçerken zarar görüyor ve kaza riski var. Acilen asfaltlama yapılması gerekiyor.',
        fotograflar: [],
        yerBilgisi: TalepYerBilgisi(
          il: 'Manisa',
          ilce: 'Salihli',
          mahalle: 'Kurtuluş Mah.',
          caddeSokak: 'Gençlik Cad.',
          disKapiNo: '8',
          icKapiNo: '',
        ),
        belediye: Belediye(id: 'salihli', ad: 'Salihli Belediyesi', il: 'Manisa', ilce: 'Salihli'),
        kullanici: {'adSoyad': 'Ali Can', 'email': 'ali.can@email.com'},
        yanit: 'Talebiniz üzerine ekiplerimiz caddedeki çukuru kapatmış ve asfaltlama çalışmasını tamamlamıştır. Hassasiyetiniz için teşekkür ederiz.',
        olusturmaTarihi: '2026-05-20T10:00:00.000Z',
        guncellemeTarihi: '2026-05-21T16:45:00.000Z',
      ),
    ];
  }
}
