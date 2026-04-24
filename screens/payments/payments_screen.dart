import 'package:flutter/material.dart';

import '../../services/application_service.dart';
import '../../services/payment_service.dart';
import '../../services/profile_service.dart';

class PaymentsScreen extends StatefulWidget {
  final String token;

  const PaymentsScreen({
    super.key,
    required this.token,
  });

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  final PaymentService paymentService = PaymentService();
  final ApplicationService applicationService = ApplicationService();
  final ProfileService profileService = ProfileService();

  bool isLoading = true;
  String? applicationId;
  String? vendorPhone;
  String? gatewayReference;
  String message = 'Loading payment details...';

  @override
  void initState() {
    super.initState();
    loadContext();
  }

  Future<void> loadContext() async {
    setState(() {
      isLoading = true;
    });

    try {
      final appsResponse = await applicationService.getMyApplications(widget.token);
      final profileResponse = await profileService.getMyProfile(widget.token);

      if (appsResponse['success'] == true) {
        final apps = appsResponse['data'] as List<dynamic>;
        if (apps.isNotEmpty) {
          applicationId = apps.first['id'] as String?;
        }
      }

      if (profileResponse['success'] == true) {
        vendorPhone = profileResponse['data']?['phone'] as String?;
      }

      message = applicationId == null
          ? 'Create an application first before making payment.'
          : 'Choose a payment method.';
    } catch (_) {
      message = 'Failed to load payment details.';
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  Future<void> payWithEcocash() async {
    if (applicationId == null || vendorPhone == null) {
      setState(() {
        message = 'Application or phone number missing.';
      });
      return;
    }

    setState(() {
      isLoading = true;
      message = 'Starting EcoCash payment...';
    });

    try {
      final response = await paymentService.initiateMobilePayment(
        token: widget.token,
        applicationId: applicationId!,
        amount: 10.00,
        phone: vendorPhone!,
        method: 'ecocash',
      );

      if (response['success'] == true) {
        final data = response['data'];
        setState(() {
          gatewayReference = data['gatewayReference'];
          message = data['instructions'] ?? 'Payment initiated. Check your phone.';
        });
      } else {
        setState(() {
          message = response['message'] ?? 'Failed to start payment.';
        });
      }
    } catch (_) {
      setState(() {
        message = 'An error occurred while starting payment.';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> checkStatus() async {
    if (gatewayReference == null) {
      setState(() {
        message = 'No payment reference yet.';
      });
      return;
    }

    setState(() {
      isLoading = true;
      message = 'Checking payment status...';
    });

    try {
      final response = await paymentService.checkPaymentStatus(
        token: widget.token,
        reference: gatewayReference!,
      );

      if (response['success'] == true) {
        final gatewayStatus = response['data']['gatewayStatus'];
        final paid = gatewayStatus['paid'] == true;

        setState(() {
          message = paid
              ? 'Payment confirmed successfully.'
              : 'Payment not yet confirmed. Try again shortly.';
        });
      } else {
        setState(() {
          message = response['message'] ?? 'Failed to check payment status.';
        });
      }
    } catch (_) {
      setState(() {
        message = 'An error occurred while checking status.';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payments')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Card(
              child: ListTile(
                title: Text('Application Fee'),
                subtitle: Text('USD 10.00'),
                trailing: Icon(Icons.payments),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: isLoading || applicationId == null ? null : payWithEcocash,
              child: const Text('Pay with EcoCash'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: isLoading ? null : checkStatus,
              child: const Text('Check Payment Status'),
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(message),
              ),
            ),
            if (isLoading) ...[
              const SizedBox(height: 16),
              const Center(child: CircularProgressIndicator()),
            ],
          ],
        ),
      ),
    );
  }
}
