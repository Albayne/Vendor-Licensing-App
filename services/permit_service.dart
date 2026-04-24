import 'dart:convert';
import 'package:http/http.dart' as http;

class PermitService {
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  Future<Map<String, dynamic>> getMyCurrentPermit(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/permits/my-current'),
      headers: {'Authorization': 'Bearer $token'},
    );

    return jsonDecode(response.body);
  }
}