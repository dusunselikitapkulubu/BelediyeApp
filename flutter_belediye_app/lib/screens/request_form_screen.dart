import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class RequestFormScreen extends StatefulWidget {
  final ApiService apiService;
  final VoidCallback onSuccess;

  const RequestFormScreen({
    super.key,
    required this.apiService,
    required this.onSuccess,
  });

  @override
  State<RequestFormScreen> createState() => _RequestFormScreenState();
}

class _RequestFormScreenState extends State<RequestFormScreen> {
  final _formKey = GlobalKey<FormState>();

  String _selectedTip = 'sikayet';
  final _baslikController = TextEditingController();
  final _detayController = TextEditingController();
  final _mahalleController = TextEditingController();
  final _caddeController = TextEditingController();
  final _disKapiController = TextEditingController();
  final _icKapiController = TextEditingController();

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Profil bilgilerini otomatik doldur
    final user = widget.apiService.currentUser;
    if (user != null) {
      _mahalleController.text = user.adres.mahalle;
      _caddeController.text = user.adres.caddeSokak;
      _disKapiController.text = user.adres.disKapiNo;
      _icKapiController.text = user.adres.icKapiNo;
    }
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      await widget.apiService.createTalep(
        tip: _selectedTip,
        baslik: _baslikController.text,
        detay: _detayController.text,
        mahalle: _mahalleController.text,
        caddeSokak: _caddeController.text,
        disKapiNo: _disKapiController.text,
        icKapiNo: _icKapiController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Talebiniz başarıyla kaydedildi!')),
        );
        widget.onSuccess();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Hata oluştu: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.apiService.currentUser;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Target Municipality Notice
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFDBEAFE)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline,
                      color: Color(0xFF2563EB), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Talebiniz profilinizde kayıtlı olan ${user?.belediye.ad ?? 'belediyenize'} iletilecektir.',
                      style: GoogleFonts.inter(
                          fontSize: 12, color: const Color(0xFF1E3A8A)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Tip Seçimi
            DropdownButtonFormField<String>(
              initialValue: _selectedTip,
              decoration: InputDecoration(
                labelText: 'Talep Tipi',
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: const [
                DropdownMenuItem(value: 'sikayet', child: Text('Şikayet')),
                DropdownMenuItem(value: 'istek', child: Text('İstek')),
                DropdownMenuItem(value: 'oneri', child: Text('Öneri')),
                DropdownMenuItem(value: 'ihbar', child: Text('İhbar')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _selectedTip = val);
              },
            ),
            const SizedBox(height: 16),

            // Başlık
            TextFormField(
              controller: _baslikController,
              decoration: InputDecoration(
                labelText: 'Talep Başlığı',
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Başlık zorunludur' : null,
            ),
            const SizedBox(height: 16),

            // Detay
            TextFormField(
              controller: _detayController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'Talep Detayı',
                alignLabelWithHint: true,
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Detay açıklaması zorunludur' : null,
            ),
            const SizedBox(height: 24),

            // Konum Başlığı
            Text(
              'Konum Bilgileri',
              style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),

            // Mahalle & Cadde/Sokak
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _mahalleController,
                    decoration: InputDecoration(
                      labelText: 'Mahalle',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Mahalle zorunludur' : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _caddeController,
                    decoration: InputDecoration(
                      labelText: 'Cadde / Sokak',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Sokak zorunludur' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Kapı Numaraları
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _disKapiController,
                    decoration: InputDecoration(
                      labelText: 'Dış Kapı No',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
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
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Gönder Butonu
            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      'Talebi İlet',
                      style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
