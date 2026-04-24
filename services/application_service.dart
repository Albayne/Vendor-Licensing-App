import 'dart:convert';
import 'package:http/http.dart' as http;

class ApplicationService {
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  Future<Map<String, dynamic>> getMyApplications(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/applications/my'),
      headers: {'Authorization': 'Bearer $token'},
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> createApplication(
    String token,
    Map<String, dynamic> applicationData,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/applications'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(applicationData),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getMarkets(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/markets'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    return jsonDecode(response.body);
  }
}
