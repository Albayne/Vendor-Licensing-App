import 'dart:convert';
import 'package:http/http.dart' as http;

class NotificationService {
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  Future<Map<String, dynamic>> getMyNotifications(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/notifications/my'),
      headers: {'Authorization': 'Bearer $token'},
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> markRead(String token, String id) async {
    final response = await http.put(
      Uri.parse('$baseUrl/notifications/$id/read'),
      headers: {'Authorization': 'Bearer $token'},
    );

    return jsonDecode(response.body);
  }
}