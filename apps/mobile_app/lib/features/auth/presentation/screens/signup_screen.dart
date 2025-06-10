import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';

class SignupScreen extends StatelessWidget {
  const SignupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(title: const Text('Inscription')),
      body: const Center(
        child: Text(
          'Écran d\'inscription',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
      ),
    );
  }
}
