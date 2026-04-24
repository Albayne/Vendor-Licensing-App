import 'package:flutter/material.dart';

import '../../services/profile_service.dart';

class ProfileScreen extends StatefulWidget {
  final String token;

  const ProfileScreen({
    super.key,
    required this.token,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ProfileService profileService = ProfileService();

  final fullNameController = TextEditingController();
  final emailController = TextEditingController();
  final addressController = TextEditingController();
  final wardController = TextEditingController();

  bool isLoading = true;
  String message = '';

  @override
  void initState() {
    super.initState();
    loadProfile();
  }

  Future<void> loadProfile() async {
    setState(() => isLoading = true);

    final response = await profileService.getMyProfile(widget.token);

    if (response['success'] == true) {
      final data = response['data'];
      fullNameController.text = data['fullName'] ?? '';
      emailController.text = data['email'] ?? '';
      addressController.text = data['address'] ?? '';
      wardController.text = data['ward'] ?? '';
    }

    if (mounted) {
      setState(() => isLoading = false);
    }
  }

  Future<void> saveProfile() async {
    setState(() => isLoading = true);

    final response = await profileService.updateMyProfile(
      token: widget.token,
      fullName: fullNameController.text.trim(),
      email: emailController.text.trim(),
      address: addressController.text.trim(),
      ward: wardController.text.trim(),
    );

    setState(() {
      message = response['message'] ?? 'Profile updated.';
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextField(
                  controller: fullNameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: addressController,
                  decoration: const InputDecoration(
                    labelText: 'Address',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: wardController,
                  decoration: const InputDecoration(
                    labelText: 'Ward',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: saveProfile,
                  child: const Text('Save Profile'),
                ),
                const SizedBox(height: 12),
                Text(message),
              ],
            ),
    );
  }
}
