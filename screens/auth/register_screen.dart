import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../shell/vendor_shell.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final formKey = GlobalKey<FormState>();
  final fullNameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final nationalIdController = TextEditingController();
  final addressController = TextEditingController();
  final wardController = TextEditingController();
  final passwordController = TextEditingController();

  Future<void> handleRegister() async {
    if (!formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.register(
      fullName: fullNameController.text.trim(),
      phone: phoneController.text.trim(),
      email: emailController.text.trim(),
      nationalId: nationalIdController.text.trim(),
      address: addressController.text.trim(),
      ward: wardController.text.trim(),
      password: passwordController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const VendorShell()),
        (_) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(authProvider.message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Vendor Registration')),
      body: Form(
        key: formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: fullNameController,
              decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
              validator: (value) => value == null || value.isEmpty ? 'Full name is required.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: phoneController,
              decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
              validator: (value) => value == null || value.isEmpty ? 'Phone is required.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: emailController,
              decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: nationalIdController,
              decoration: const InputDecoration(labelText: 'National ID', border: OutlineInputBorder()),
              validator: (value) => value == null || value.isEmpty ? 'National ID is required.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: addressController,
              decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()),
              validator: (value) => value == null || value.isEmpty ? 'Address is required.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: wardController,
              decoration: const InputDecoration(labelText: 'Ward', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
              validator: (value) => value == null || value.length < 6 ? 'Use at least 6 characters.' : null,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: authProvider.isLoading ? null : handleRegister,
              child: authProvider.isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Register'),
            ),
          ],
        ),
      ),
    );
  }
}
