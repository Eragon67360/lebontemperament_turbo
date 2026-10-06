import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/widgets/fade_in_up.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/services/auth_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/google_logo.dart';

/// Sign in with Apple is offered on iOS only: App Store review requires it
/// next to Google there, and on Android it would need a web flow with a
/// secret to renew every six months.
bool get showAppleSignIn =>
    !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

/// Loose on purpose: Supabase validates the address, the field only catches
/// a typo (no « @ », no domain). Long TLDs and « + » tags are valid.
bool isValidEmail(String value) =>
    RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$').hasMatch(value.trim());

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: Stack(
        children: [
          // Main content with form
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: const [
                    // --- 1. Header ---
                    FadeInUp(delay: 100, child: _LoginHeader()),
                    SizedBox(height: 48),

                    // --- 2. Login Form ---
                    FadeInUp(delay: 200, child: _LoginForm()),
                  ],
                ),
              ),
            ),
          ),
          // --- 3. Loading Overlay ---
          if (isLoading)
            Container(
              color: theme.colorScheme.surface.withValues(alpha: 0.5),
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}

// MARK: - UI Components

class _LoginHeader extends StatelessWidget {
  const _LoginHeader();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: theme.colorScheme.primary,
          ),
          child: Icon(
            Icons.music_note_rounded,
            size: 40,
            color: theme.colorScheme.onPrimary,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Bienvenue',
          style: AppFonts.sans(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Connectez-vous pour continuer',
          style: AppFonts.sans(
            fontSize: 16,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _LoginForm extends ConsumerStatefulWidget {
  const _LoginForm();

  @override
  ConsumerState<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<_LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
      ),
    );
  }

  Future<void> _handleLogin() async {
    // Hide keyboard
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) return;

    try {
      await ref
          .read(authControllerProvider.notifier)
          .signIn(_emailController.text.trim(), _passwordController.text);
      // Navigation is handled by the auth state listener in the router
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar(
          e is SignInException
              ? e.message
              : 'Connexion impossible. Réessayez dans quelques instants.',
        );
      }
    }
  }

  Future<void> _handleSocial(Future<void> Function() signIn) async {
    FocusScope.of(context).unfocus();
    try {
      await signIn();
      // Navigation is handled by the auth state listener in the router
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar(
          e is SignInException
              ? e.message
              : 'Connexion impossible. Réessayez dans quelques instants.',
        );
      }
    }
  }

  /// Opens the website's reset page in the browser: the e-mail it sends
  /// brings the member back to that same browser, where the flow completes
  /// (see [forgotPasswordUri]).
  Future<void> _openForgotPassword() async {
    FocusScope.of(context).unfocus();
    final uri = forgotPasswordUri();
    var opened = false;
    try {
      opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      opened = false;
    }
    if (!opened && mounted) {
      _showErrorSnackBar(
        'Impossible d\'ouvrir le navigateur. Rendez-vous sur '
        '${uri.host}${uri.path} pour réinitialiser votre mot de passe.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;

    // Custom InputDecoration for our text fields
    final customInputDecoration = InputDecoration(
      filled: true,
      fillColor: theme.colorScheme.surfaceContainerHighest.withValues(
        alpha: 0.5,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: theme.colorScheme.primary, width: 2),
      ),
      prefixIconColor: WidgetStateColor.resolveWith(
        (states) => states.contains(WidgetState.focused)
            ? theme.colorScheme.primary
            : theme.colorScheme.onSurfaceVariant,
      ),
    );

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // --- Email Field ---
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: customInputDecoration.copyWith(
              labelText: 'E-mail',
              prefixIcon: const Icon(Icons.email_outlined),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Veuillez entrer votre e-mail';
              }
              if (!isValidEmail(value)) {
                return 'Veuillez entrer un e-mail valide';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          // --- Password Field ---
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _handleLogin(),
            decoration: customInputDecoration.copyWith(
              labelText: 'Mot de passe',
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                tooltip: _obscurePassword
                    ? 'Afficher le mot de passe'
                    : 'Masquer le mot de passe',
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty)
                return 'Veuillez entrer votre mot de passe';
              if (value.length < 6)
                return 'Le mot de passe doit contenir au moins 6 caractères';
              return null;
            },
          ),
          const SizedBox(height: 8),

          // --- Forgot Password ---
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: isLoading ? null : _openForgotPassword,
              child: const Text('Mot de passe oublié ?'),
            ),
          ),
          const SizedBox(height: 24),

          // --- Login Button ---
          FilledButton(
            onPressed: isLoading ? null : _handleLogin,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              textStyle: AppFonts.sans(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            child: const Text('Se connecter'),
          ),
          const SizedBox(height: 24),

          // --- Google / Apple ---
          const _OrDivider(),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: isLoading
                ? null
                : () => _handleSocial(
                    ref.read(authControllerProvider.notifier).signInWithGoogle,
                  ),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              textStyle: AppFonts.sans(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            icon: const GoogleLogo(),
            label: const Text('Continuer avec Google'),
          ),
          if (showAppleSignIn) ...[
            const SizedBox(height: 12),
            SignInWithAppleButton(
              text: 'Continuer avec Apple',
              height: 52,
              borderRadius: const BorderRadius.all(Radius.circular(26)),
              style: theme.brightness == Brightness.dark
                  ? SignInWithAppleButtonStyle.white
                  : SignInWithAppleButtonStyle.black,
              onPressed: isLoading
                  ? null
                  : () => _handleSocial(
                      ref.read(authControllerProvider.notifier).signInWithApple,
                    ),
            ),
          ],
        ],
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'ou',
            style: AppFonts.sans(
              fontSize: 14,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }
}
