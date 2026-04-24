import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorageService {
  static const _tokenKey = 'vendor_auth_token';
  static const _phoneKey = 'vendor_phone';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> saveSession({required String token, String? phone}) async {
    await _storage.write(key: _tokenKey, value: token);
    if (phone != null && phone.isNotEmpty) {
      await _storage.write(key: _phoneKey, value: phone);
    }
  }

  Future<String?> readToken() => _storage.read(key: _tokenKey);
  Future<String?> readPhone() => _storage.read(key: _phoneKey);

  Future<void> clearSession() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _phoneKey);
  }
}
