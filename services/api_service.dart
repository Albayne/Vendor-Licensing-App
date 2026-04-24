import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Android emulator loopback. Replace for a real device when needed.
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  Future<Map<String, dynamic>> vendorLogin({
    required String login,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/vendor/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'login': login,
        'password': password,
      }),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> vendorRegister({
    required String fullName,
    required String phone,
    required String email,
    required String nationalId,
    required String address,
    required String ward,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/vendor/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'fullName': fullName,
        'phone': phone,
        'email': email,
        'nationalId': nationalId,
        'address': address,
        'ward': ward,
        'password': password,
      }),
    );

    return jsonDecode(response.body);
  }
}
