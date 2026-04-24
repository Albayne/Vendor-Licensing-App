import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/document_service.dart';

class UploadDocumentsScreen extends StatefulWidget {
  final String token;
  final String applicationId;

  const UploadDocumentsScreen({
    super.key,
    required this.token,
    required this.applicationId,
  });

  @override
  State<UploadDocumentsScreen> createState() => _UploadDocumentsScreenState();
}

class _UploadDocumentsScreenState extends State<UploadDocumentsScreen> {
  final DocumentService documentService = DocumentService();
  final ImagePicker picker = ImagePicker();

  File? selectedFile;
  String selectedDocumentType = 'national_id';
  String message = 'Select a file to upload.';
  bool isLoading = false;

  Future<void> pickFileFromGallery() async {
    final XFile? picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() {
        selectedFile = File(picked.path);
      });
    }
  }

  Future<void> uploadFile() async {
    if (selectedFile == null) {
      setState(() {
        message = 'Please select a file first.';
      });
      return;
    }

    setState(() {
      isLoading = true;
      message = 'Uploading document...';
    });

    try {
      final response = await documentService.uploadDocument(
        token: widget.token,
        file: selectedFile!,
        documentType: selectedDocumentType,
        applicationId: widget.applicationId,
      );

      setState(() {
        message = response['message'] ?? 'Upload finished.';
      });
    } catch (e) {
      setState(() {
        message = 'An error occurred during upload.';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final documentTypes = [
      'national_id',
      'proof_of_residence',
      'police_clearance',
      'health_certificate',
      'passport_photo',
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Upload Documents')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            DropdownButtonFormField<String>(
              initialValue: selectedDocumentType,
              items: documentTypes.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Text(type),
                );
              }).toList(),
              onChanged: (val) {
                setState(() {
                  selectedDocumentType = val!;
                });
              },
              decoration: const InputDecoration(
                labelText: 'Document Type',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: pickFileFromGallery,
              child: const Text('Choose File'),
            ),
            const SizedBox(height: 12),
            if (selectedFile != null) Text(selectedFile!.path),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: isLoading ? null : uploadFile,
              child: const Text('Upload Document'),
            ),
            const SizedBox(height: 20),
            Text(message),
            if (isLoading) ...[
              const SizedBox(height: 16),
              const CircularProgressIndicator(),
            ],
          ],
        ),
      ),
    );
  }
}