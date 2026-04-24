import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../services/permit_service.dart';

class MyPermitScreen extends StatefulWidget {
  final String token;

  const MyPermitScreen({
    super.key,
    required this.token,
  });

  @override
  State<MyPermitScreen> createState() => _MyPermitScreenState();
}

class _MyPermitScreenState extends State<MyPermitScreen> {
  final PermitService permitService = PermitService();
  Map<String, dynamic>? permit;
  bool isLoading = true;
  String message = "";

  @override
  void initState() {
    super.initState();
    loadPermit();
  }

  Future<void> loadPermit() async {
    setState(() => isLoading = true);

    final response = await permitService.getMyCurrentPermit(widget.token);

    if (response['success'] == true) {
      permit = response['data'];
    } else {
      message = response['message'] ?? 'No active permit found.';
    }

    if (mounted) {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (permit == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Permit')),
        body: Center(child: Text(message)),
      );
    }

    final allocation = permit!['allocation'];
    final stall = allocation['stall'];
    final market = stall['market'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Digital Permit'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    permit!['permitNumber'],
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  QrImageView(
                    data: permit!['qrPayload'],
                    size: 220,
                  ),
                  const SizedBox(height: 16),
                  Text('Market: ${market['marketName']}'),
                  Text('Stall: ${stall['stallCode']}'),
                  Text('Expires: ${permit!['expiresAt']}'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}