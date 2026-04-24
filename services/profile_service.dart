import 'dart:convert';
import 'package:http/http.dart' as http;

class ProfileService {
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  Future<Map<String, dynamic>> getMyProfile(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/profile/me'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> updateMyProfile({
    required String token,
    required String fullName,
    required String email,
    required String address,
    required String ward,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/profile/me'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fullName': fullName,
        'email': email,
        'address': address,
        'ward': ward,
      }),
    );

    return jsonDecode(response.body);
  }
}