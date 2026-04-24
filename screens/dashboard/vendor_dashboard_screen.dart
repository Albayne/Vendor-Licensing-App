import 'package:flutter/material.dart';

import '../../services/application_service.dart';
import '../../services/notification_service.dart';
import '../../widgets/status_chip.dart';
import '../notifications/notifications_screen.dart';

class VendorDashboardScreen extends StatefulWidget {
  final String token;

  const VendorDashboardScreen({
    super.key,
    required this.token,
  });

  @override
  State<VendorDashboardScreen> createState() => _VendorDashboardScreenState();
}

class _VendorDashboardScreenState extends State<VendorDashboardScreen> {
  final ApplicationService applicationService = ApplicationService();
  final NotificationService notificationService = NotificationService();

  bool isLoading = true;
  String latestStatus = 'draft';
  int notificationCount = 0;
  String stallText = 'No allocation yet';

  @override
  void initState() {
    super.initState();
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    setState(() => isLoading = true);

    try {
      final applicationResponse = await applicationService.getMyApplications(widget.token);
      final notificationResponse = await notificationService.getMyNotifications(widget.token);

      if (applicationResponse['success'] == true) {
        final apps = applicationResponse['data'] as List<dynamic>;
        if (apps.isNotEmpty) {
          final latest = apps.first;
          latestStatus = latest['status'] ?? 'draft';

          if (latest['allocation'] != null && latest['allocation']['stall'] != null) {
            stallText = latest['allocation']['stall']['stallCode'] ?? 'Allocated';
          }
        }
      }

      if (notificationResponse['success'] == true) {
        final notifications = notificationResponse['data'] as List<dynamic>;
        notificationCount = notifications.where((n) => n['isRead'] == false).length;
      }
    } catch (_) {
      // Keep safe fallback UI if the API is unavailable.
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vendor Dashboard'),
        actions: [
          IconButton(
            icon: Badge(
              label: Text(notificationCount.toString()),
              isLabelVisible: notificationCount > 0,
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => NotificationsScreen(token: widget.token),
                ),
              );
            },
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadDashboard,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.description, color: Colors.green),
                      title: const Text('Application Status'),
                      subtitle: const Text('Latest application'),
                      trailing: StatusChip(status: latestStatus),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.notifications, color: Colors.green),
                      title: const Text('Unread Notifications'),
                      subtitle: Text('$notificationCount unread'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.store, color: Colors.green),
                      title: const Text('Stall Allocation'),
                      subtitle: Text(stallText),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
