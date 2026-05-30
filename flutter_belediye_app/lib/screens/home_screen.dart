import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import 'complaints_screen.dart';
import 'request_form_screen.dart';
import 'profile_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final ApiService apiService;
  const HomeScreen({super.key, required this.apiService});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  List<Talep> _myTalepler = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadMyTalepler();
  }

  Future<void> _loadMyTalepler() async {
    setState(() => _isLoading = true);
    try {
      final data = await widget.apiService.getKullaniciTalepleri();
      setState(() => _myTalepler = data);
    } catch (e) {
      print(e);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildDashboard() {
    final user = widget.apiService.currentUser;
    if (user == null) return const Center(child: Text('Giriş bulunamadı.'));

    final completedCount =
        _myTalepler.where((t) => t.durum == 'tamamlandi').length;
    final pendingCount = _myTalepler
        .where((t) => t.durum == 'bekliyor' || t.durum == 'isleniyor')
        .length;

    return RefreshIndicator(
      onRefresh: _loadMyTalepler,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: const Color(0xFFEFF6FF),
                  child: Text(
                    user.adSoyad.isNotEmpty ? user.adSoyad[0] : 'U',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Merhaba,',
                      style: GoogleFonts.inter(
                          fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                    Text(
                      user.adSoyad,
                      style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Quick Stats Grid
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    title: 'Tamamlanan',
                    count: completedCount.toString(),
                    color: const Color(0xFF10B981),
                    icon: Icons.check_circle_outline,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    title: 'İşlemdeki / Bekleyen',
                    count: pendingCount.toString(),
                    color: const Color(0xFFF59E0B),
                    icon: Icons.pending_actions_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),

            // Section Header
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Text(
                  'Son Taleplerim',
                  style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1E293B)),
                ),
                TextButton(
                  onPressed: () {
                    // Navigate to my requests list or tab
                  },
                  child: const Text('Tümünü Gör'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Taleplerim List
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _myTalepler.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _myTalepler.take(3).length,
                        itemBuilder: (context, index) {
                          final talep = _myTalepler[index];
                          return _buildTalepCard(talep);
                        },
                      ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String count,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(
            count,
            style: GoogleFonts.outfit(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B)),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style:
                GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildTalepCard(Talep talep) {
    Color durumColor = const Color(0xFF64748B);
    String durumText = 'Bekliyor';
    if (talep.durum == 'isleniyor') {
      durumColor = const Color(0xFF2563EB);
      durumText = 'İşleniyor';
    } else if (talep.durum == 'tamamlandi') {
      durumColor = const Color(0xFF10B981);
      durumText = 'Tamamlandı';
    } else if (talep.durum == 'reddedildi') {
      durumColor = const Color(0xFFEF4444);
      durumText = 'Reddedildi';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(
                talep.referansNo,
                style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF64748B)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, py: 4),
                decoration: BoxDecoration(
                  color: durumColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  durumText,
                  style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: durumColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            talep.baslik,
            style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B)),
          ),
          const SizedBox(height: 4),
          Text(
            talep.detay,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style:
                GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40),
      alignment: Alignment.center,
      child: Column(
        children: [
          const Icon(Icons.note_alt_outlined,
              size: 48, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 12),
          Text(
            'Henüz Talebiniz Bulunmuyor',
            style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 4),
          Text(
            'Belediyenize ilk talebi göndermek için + butonuna basın.',
            style:
                GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> tabs = [
      _buildDashboard(),
      ComplaintsScreen(apiService: widget.apiService),
      RequestFormScreen(
        apiService: widget.apiService,
        onSuccess: () {
          setState(() {
            _currentIndex = 0; // Go back to Home tab
          });
          _loadMyTalepler();
        },
      ),
      ProfileScreen(
        apiService: widget.apiService,
        onLogout: () {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => LoginScreen(apiService: widget.apiService),
            ),
          );
        },
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          _currentIndex == 0
              ? 'Ana Sayfa'
              : _currentIndex == 1
                  ? 'Şikayetler'
                  : _currentIndex == 2
                      ? 'Talep Gönder'
                      : 'Profilim',
          style: GoogleFonts.outfit(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF2563EB),
        unselectedItemColor: const Color(0xFF94A3B8),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Ana Sayfa',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.explore_outlined),
            activeIcon: Icon(Icons.explore),
            label: 'Şikayetler',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle_outline),
            activeIcon: Icon(Icons.add_circle),
            label: 'Talep Gönder',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
