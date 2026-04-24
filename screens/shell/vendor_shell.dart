import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../application/create_application_screen.dart';
import '../auth/login_screen.dart';
import '../dashboard/vendor_dashboard_screen.dart';
import '../payments/payments_screen.dart';
import '../permit/permit_screen.dart';
import '../profile/profile_screen.dart';

class VendorShell extends StatefulWidget {
  const VendorShell({super.key});

  @override
  State<VendorShell> createState() => _VendorShellState();
}

class _VendorShellState extends State<VendorShell> {
  int currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final token = authProvider.token ?? '';

    final pages = [
      VendorDashboardScreen(token: token),
      CreateApplicationScreen(token: token),
      PaymentsScreen(token: token),
      MyPermitScreen(token: token),
      ProfileScreen(token: token),
    ];

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: IndexedStack(index: currentIndex, children: pages),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: currentIndex,
          type: BottomNavigationBarType.fixed,
          onTap: (index) {
            setState(() => currentIndex = index);
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.description_outlined), label: 'Apply'),
            BottomNavigationBarItem(icon: Icon(Icons.payments_outlined), label: 'Payments'),
            BottomNavigationBarItem(icon: Icon(Icons.qr_code), label: 'Permit'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
          ],
        ),
        floatingActionButton: currentIndex == 4
            ? FloatingActionButton.extended(
                onPressed: () async {
                  await context.read<AuthProvider>().logout();
                  if (mounted) {
                    // ignore: use_build_context_synchronously
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (_) => false,
                    );
                  }
                },
                label: const Text('Logout'),
                icon: const Icon(Icons.logout),
              )
            : null,
      ),
    );
  }
}
