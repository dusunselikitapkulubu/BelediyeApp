import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class ComplaintsScreen extends StatefulWidget {
  final ApiService apiService;
  const ComplaintsScreen({super.key, required this.apiService});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  List<Talep> _allComplaints = [];
  List<Talep> _filteredComplaints = [];
  bool _isLoading = false;

  String _searchText = '';
  String _selectedIl = '';
  String _selectedIlce = '';

  List<String> _iller = [];
  List<String> _ilceler = [];

  @override
  void initState() {
    super.initState();
    _loadComplaints();
  }

  Future<void> _loadComplaints() async {
    setState(() => _isLoading = true);
    try {
      final list = await widget.apiService.getSikayetler(tip: 'sikayet');
      setState(() {
        _allComplaints = list;
        _extractFilters();
        _applyFilters();
      });
    } catch (e) {
      print(e);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _extractFilters() {
    _iller = _allComplaints
        .map((c) => c.yerBilgisi.il)
        .where((il) => il.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    _updateIlceList();
  }

  void _updateIlceList() {
    if (_selectedIl.isEmpty) {
      _ilceler = [];
    } else {
      _ilceler = _allComplaints
          .where((c) => c.yerBilgisi.il == _selectedIl)
          .map((c) => c.yerBilgisi.ilce)
          .where((ilce) => ilce.isNotEmpty)
          .toSet()
          .toList()
        ..sort();
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredComplaints = _allComplaints.where((c) {
        final matchesSearch =
            c.baslik.toLowerCase().contains(_searchText.toLowerCase()) ||
                c.detay.toLowerCase().contains(_searchText.toLowerCase()) ||
                c.belediye.ad.toLowerCase().contains(_searchText.toLowerCase());

        final matchesIl = _selectedIl.isEmpty || c.yerBilgisi.il == _selectedIl;
        final matchesIlce =
            _selectedIlce.isEmpty || c.yerBilgisi.ilce == _selectedIlce;

        return matchesSearch && matchesIl && matchesIlce;
      }).toList();
    });
  }

  String _maskName(String name) {
    if (name.isEmpty) return 'Gizli Kullanıcı';
    final parts = name.split(' ');
    if (parts.length == 1) {
      return '${parts[0].substring(0, parts[0].length > 2 ? 2 : parts[0].length)}***';
    }
    final first = parts.sublist(0, parts.length - 1).join(' ');
    final last = parts.last;
    return '$first ${last.substring(0, 1)}***';
  }

  void _showDetailBottomSheet(Talep talep) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.campaign_outlined, color: Color(0xFFE11D48)),
                const SizedBox(width: 8),
                Text(
                  talep.belediye.ad,
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF2563EB)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              talep.baslik,
              style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Text(
                talep.detay,
                style: GoogleFonts.inter(
                    fontSize: 13, height: 1.5, color: const Color(0xFF475569)),
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow(Icons.pin_drop_outlined, 'Konum',
                '${talep.yerBilgisi.ilce}, ${talep.yerBilgisi.il}'),
            _buildInfoRow(Icons.person_outline, 'Oluşturan',
                _maskName(talep.kullanici['adSoyad'] ?? '')),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content:
                          Text('Şikayet belediyenize başarıyla iletildi!')),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE11D48),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: Text(
                'Kendi Belediyeme İlet',
                style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 8),
          Text('$label: ',
              style: GoogleFonts.inter(
                  fontSize: 12, color: const Color(0xFF64748B))),
          Text(value,
              style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF334155))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search & Filter Panel
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Column(
            children: [
              TextField(
                onChanged: (val) {
                  _searchText = val;
                  _applyFilters();
                },
                decoration: InputDecoration(
                  hintText: 'Şikayet başlığı veya belediye ara...',
                  prefixIcon: const Icon(Icons.search),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFFF1F5F9)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _selectedIl.isEmpty ? null : _selectedIl,
                      hint: const Text('İl Seçin'),
                      decoration: InputDecoration(
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 12),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      items: [
                        const DropdownMenuItem(
                            value: '', child: Text('Tüm İller')),
                        ..._iller.map((il) =>
                            DropdownMenuItem(value: il, child: Text(il))),
                      ],
                      onChanged: (val) {
                        setState(() {
                          _selectedIl = val ?? '';
                          _selectedIlce = '';
                          _updateIlceList();
                          _applyFilters();
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue:
                          _selectedIlce.isEmpty ? null : _selectedIlce,
                      hint: const Text('İlçe Seçin'),
                      decoration: InputDecoration(
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 12),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      items: [
                        const DropdownMenuItem(
                            value: '', child: Text('Tüm İlçeler')),
                        ..._ilceler.map((ilce) =>
                            DropdownMenuItem(value: ilce, child: Text(ilce))),
                      ],
                      onChanged: (val) {
                        setState(() {
                          _selectedIlce = val ?? '';
                          _applyFilters();
                        });
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // List
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _filteredComplaints.isEmpty
                  ? Center(
                      child: Text('Şikayet bulunamadı.',
                          style: GoogleFonts.inter()))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _filteredComplaints.length,
                      itemBuilder: (context, index) {
                        final complaint = _filteredComplaints[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: const BorderSide(color: Color(0xFFF1F5F9)),
                          ),
                          elevation: 0,
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            title: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  complaint.belediye.ad,
                                  style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF2563EB)),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  complaint.baslik,
                                  style: GoogleFonts.outfit(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 8.0),
                              child: Text(
                                complaint.detay,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(fontSize: 12),
                              ),
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => _showDetailBottomSheet(complaint),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
