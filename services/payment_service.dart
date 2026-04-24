import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentService {
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  Future<Map<String, dynamic>> initiateMobilePayment({
    required String token,
    required String applicationId,
    required double amount,
    required String phone,
    String method = 'ecocash',
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/payments/initiate'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'applicationId': applicationId,
        'paymentType': 'application_fee',
        'amount': amount,
        'channel': 'mobile',
        'method': method,
        'phone': phone,
      }),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> initiateWebPayment({
    required String token,
    required String applicationId,
    required double amount,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/payments/initiate'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'applicationId': applicationId,
        'paymentType': 'application_fee',
        'amount': amount,
        'channel': 'web',
      }),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> checkPaymentStatus({
    required String token,
    required String reference,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/payments/$reference/status'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    return jsonDecode(response.body);
  }
}