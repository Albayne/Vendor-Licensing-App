import 'package:flutter/material.dart';
import '../../services/notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  final String token;

  const NotificationsScreen({
    super.key,
    required this.token,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationService notificationService = NotificationService();
  List<dynamic> notifications = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    setState(() => isLoading = true);

    final response = await notificationService.getMyNotifications(widget.token);

    if (response['success'] == true) {
      notifications = response['data'];
    }

    if (mounted) {
      setState(() => isLoading = false);
    }
  }

  Future<void> markRead(String id) async {
    await notificationService.markRead(widget.token, id);
    await loadNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final item = notifications[index];

                return Card(
                  child: ListTile(
                    title: Text(item['title'] ?? ''),
                    subtitle: Text(item['message'] ?? ''),
                    trailing: item['isRead'] == true
                        ? const Icon(Icons.done, color: Colors.green)
                        : TextButton(
                            onPressed: () => markRead(item['id']),
                            child: const Text('Mark read'),
                          ),
                  ),
                );
              },
            ),
    );
  }
}