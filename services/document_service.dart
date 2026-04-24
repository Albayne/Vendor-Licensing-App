import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class DocumentService {
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  Future<Map<String, dynamic>> uploadDocument({
    required String token,
    required File file,
    required String documentType,
    String? applicationId,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/documents/upload'),
    );

    request.headers['Authorization'] = 'Bearer $token';
    request.fields['documentType'] = documentType;

    if (applicationId != null) {
      request.fields['applicationId'] = applicationId;
    }

    request.files.add(
      await http.MultipartFile.fromPath('file', file.path),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getMyDocuments({
    required String token,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/documents/my'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    return jsonDecode(response.body);
  }
}