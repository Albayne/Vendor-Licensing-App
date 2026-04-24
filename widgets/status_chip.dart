import 'package:flutter/material.dart';

class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({
    super.key,
    required this.status,
  });

  Color _getColor() {
    switch (status.toLowerCase()) {
      case 'submitted':
        return Colors.blue;
      case 'paid':
        return Colors.indigo;
      case 'under_review':
        return Colors.orange;
      case 'approved':
      case 'awaiting_allocation':
        return Colors.green;
      case 'allocated':
        return Colors.teal;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(
        status.replaceAll('_', ' ').toUpperCase(),
        style: const TextStyle(color: Colors.white),
      ),
      backgroundColor: _getColor(),
    );
  }
}