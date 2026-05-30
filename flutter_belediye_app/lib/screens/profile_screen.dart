import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class ProfileScreen extends StatefulWidget {
  final ApiService apiService;
  final VoidCallback onLogout;
  
  const ProfileScreen({
    super.key,
    required this.apiService,
    required this.onLogout,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _adController = TextEditingController();
  final _telController = TextEditingController();
  final _emailController = TextEditingController();
  
  final _mahalleController = TextEditingController();
  final _caddeController = TextEditingController();
  final _disKapiController = TextEditingController();
  final _icKapiController = TextEditingController();

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  void _loadProfile() {
    final user = widget.apiService.currentUser;
    if (user != null) {
      _adController.text = user.adSoyad;
      _telController.text = user.telefon;
      _emailController.text = user.email;
      _mahalleController.text = user.adres.mahalle;
      _caddeController.text = user.adres.caddeSokak;
      _disKapiController.text = user.adres.disKapiNo;
      _icKapiController.text = user.adres.icKapiNo;
    }
  }

  void _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    
    final current = widget.apiService.currentUser;
    if (current == null) return;

    setState(() => _isSaving = true);
    
    final updated = Kullanici(
      id: current.id,
      adSoyad: _adController.text,
      tcKimlikNo: current.tcKimlikNo,
      telefon: _telController.text,
      email: _emailController.text,
      belediye: current.belediye,
      adres: Adres(
        il: current.adres.il,
        ilce: current.adres.ilce,
        mahalle: _mahalleController.text,
        caddeSokak: _caddeController.text,
        disKapiNo: _disKapiController.text,
        icKapiNo: _icKapiController.text,
      ),
    );

    try {
      await widget.apiService.updateProfile(updated);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profil başarıyla güncellendi!')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Hata: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.apiService.currentUser;
    if (user == null) return const Center(child: Text('Giriş yapılmamış.'));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // E-Devlet Verified Tag
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.green[100]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.verified_user_rounded, color: Colors.green[600]),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'T.C. Vatandaşı Doğrulaması',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.green[800]),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Kimlik bilgileriniz e-Devlet ile doğrulanmıştır.',
                          style: GoogleFonts.inter(fontSize: 11, color: Colors.green[700]),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Kişisel Bilgiler
            Text(
              'Kişisel Bilgiler',
              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _adController,
              decoration: InputDecoration(
                labelText: 'Ad Soyad',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Gerekli' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _telController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Telefon Numarası',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Gerekli' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'E-posta Adresi',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Gerekli' : null,
            ),
            const SizedBox(height: 28),

            // Adres Bilgileri
            Text(
              'İletişim & Adres Bilgileri',
              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _mahalleController,
              decoration: InputDecoration(
                labelText: 'Mahalle',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Gerekli' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _caddeController,
              decoration: InputDecoration(
                labelText: 'Cadde / Sokak',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Gerekli' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _disKapiController,
                    decoration: InputDecoration(
                      labelText: 'Dış Kapı No',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Gerekli' : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _icKapiController,
                    decoration: InputDecoration(
                      labelText: 'İç Kapı No (Daire)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Kaydet Butonu
            ElevatedButton(
              onPressed: _isSaving ? null : _handleSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      'Profili Güncelle',
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
            ),
            const SizedBox(height: 12),

            // Çıkış Butonu
            TextButton(
              onPressed: () async {
                await widget.apiService.logout();
                widget.onLogout();
              },
              child: Text(
                'Oturumu Kapat',
                style: GoogleFonts.inter(color: Colors.red[600], fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
