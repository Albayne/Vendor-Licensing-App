import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/auth_storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final AuthStorageService _storageService = AuthStorageService();

  String? _token;
  String? _phone;
  bool _isLoading = false;
  bool _isInitialized = false;
  String _message = '';

  String? get token => _token;
  String? get phone => _phone;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get isLoggedIn => _token != null && _token!.isNotEmpty;
  String get message => _message;

  Future<void> initialize() async {
    _token = await _storageService.readToken();
    _phone = await _storageService.readPhone();
    _isInitialized = true;
    notifyListeners();
  }

  Future<bool> login({required String login, required String password}) async {
    _isLoading = true;
    _message = '';
    notifyListeners();

    try {
      final response = await _apiService.vendorLogin(login: login, password: password);
      if (response['success'] == true) {
        _token = response['data']?['token'] as String?;
        _phone = response['data']?['vendor']?['phone'] as String?;
        await _storageService.saveSession(token: _token ?? '', phone: _phone);
        _message = response['message'] ?? 'Login successful.';
        return true;
      }

      _message = response['message'] ?? 'Login failed.';
      return false;
    } catch (_) {
      _message = 'An error occurred while logging in.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String fullName,
    required String phone,
    required String email,
    required String nationalId,
    required String address,
    required String ward,
    required String password,
  }) async {
    _isLoading = true;
    _message = '';
    notifyListeners();

    try {
      final response = await _apiService.vendorRegister(
        fullName: fullName,
        phone: phone,
        email: email,
        nationalId: nationalId,
        address: address,
        ward: ward,
        password: password,
      );

      if (response['success'] == true) {
        _token = response['data']?['token'] as String?;
        _phone = response['data']?['vendor']?['phone'] as String?;
        await _storageService.saveSession(token: _token ?? '', phone: _phone);
        _message = response['message'] ?? 'Registration successful.';
        return true;
      }

      _message = response['message'] ?? 'Registration failed.';
      return false;
    } catch (_) {
      _message = 'An error occurred while registering.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _token = null;
    _phone = null;
    _message = '';
    await _storageService.clearSession();
    notifyListeners();
  }
}
