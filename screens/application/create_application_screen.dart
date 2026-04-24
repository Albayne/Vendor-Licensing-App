import 'package:flutter/material.dart';

import '../../services/application_service.dart';
import 'upload_documents_screen.dart';

class CreateApplicationScreen extends StatefulWidget {
  final String token;

  const CreateApplicationScreen({super.key, required this.token});

  @override
  State<CreateApplicationScreen> createState() => _CreateApplicationScreenState();
}

class _CreateApplicationScreenState extends State<CreateApplicationScreen> {
  final formKey = GlobalKey<FormState>();
  final ApplicationService applicationService = ApplicationService();
  final businessNameController = TextEditingController();

  final List<String> categories = const [
    'Produce',
    'Clothing',
    'Food',
    'Electronics',
    'Crafts',
    'Other',
  ];

  final List<String> marketTypes = const [
    'Open Market',
    'Flea Market',
    'Lockup Stall',
    'Food Court',
  ];

  List<dynamic> markets = [];
  String? selectedCategory;
  String? selectedMarketType;
  String? selectedMarketId;
  String message = 'Complete the form to submit a license application.';
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    loadMarkets();
  }

  Future<void> loadMarkets() async {
    final response = await applicationService.getMarkets(widget.token);
    if (response['success'] == true) {
      setState(() {
        markets = response['data'] as List<dynamic>;
      });
    }
  }

  Future<void> submitApplication() async {
    if (!formKey.currentState!.validate()) return;

    setState(() {
      isLoading = true;
      message = 'Submitting application...';
    });

    final response = await applicationService.createApplication(widget.token, {
      'businessName': businessNameController.text.trim(),
      'businessCategory': selectedCategory,
      'marketType': selectedMarketType,
      'requestedMarketId': selectedMarketId,
    });

    if (!mounted) return;

    setState(() {
      isLoading = false;
      message = response['message'] ?? 'Application submitted.';
    });

    if (response['success'] == true) {
      final applicationId = response['data']?['id'] as String?;
      if (applicationId != null && applicationId.isNotEmpty) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => UploadDocumentsScreen(
              token: widget.token,
              applicationId: applicationId,
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New License Application')),
      body: Form(
        key: formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: businessNameController,
              decoration: const InputDecoration(
                labelText: 'Business Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: selectedCategory,
              decoration: const InputDecoration(
                labelText: 'Business Category',
                border: OutlineInputBorder(),
              ),
              items: categories
                  .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                  .toList(),
              onChanged: (val) => setState(() => selectedCategory = val),
              validator: (value) => value == null ? 'Select a business category.' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: selectedMarketType,
              decoration: const InputDecoration(
                labelText: 'Market Type',
                border: OutlineInputBorder(),
              ),
              items: marketTypes
                  .map((type) => DropdownMenuItem(value: type, child: Text(type)))
                  .toList(),
              onChanged: (val) => setState(() => selectedMarketType = val),
              validator: (value) => value == null ? 'Select a market type.' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: selectedMarketId,
              decoration: const InputDecoration(
                labelText: 'Preferred Market',
                border: OutlineInputBorder(),
              ),
              items: markets
                  .map(
                    (market) => DropdownMenuItem<String>(
                      value: market['id'] as String,
                      child: Text(market['marketName'] as String),
                    ),
                  )
                  .toList(),
              onChanged: (val) => setState(() => selectedMarketId = val),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: isLoading ? null : submitApplication,
              child: isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Submit Application'),
            ),
            const SizedBox(height: 12),
            Text(message),
            const SizedBox(height: 20),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'After submitting, you will be taken to the document upload screen so you can attach the required files before payment and review.',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
