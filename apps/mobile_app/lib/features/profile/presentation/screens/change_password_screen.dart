import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/data/services/auth_service.dart';
import '../../data/password_service.dart';

/// Profil › Mot de passe: the current password (when the account has one),
/// then the new one twice. Members who signed in only with Google or Apple
/// create one here, without a current password.
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirmation = TextEditingController();
  bool _obscure = true;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirmation.dispose();
    super.dispose();
  }

  Future<void> _save(PasswordService service) async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      await service.change(
        current: ref.read(accountHasPasswordProvider) ? _current.text : null,
        next: _next.text,
      );
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('Mot de passe modifié.')),
      );
    } on PasswordChangeException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = const PasswordChangeException(
            PasswordChangeFailure.server,
          ).message,
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openForgotPassword() async {
    final uri = forgotPasswordUri();
    var opened = false;
    try {
      opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      opened = false;
    }
    if (!opened && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Impossible d\'ouvrir le navigateur. Rendez-vous sur '
            '${uri.host}${uri.path} pour réinitialiser votre mot de passe.',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = theme.colorScheme;
    final service = ref.watch(passwordServiceProvider);
    final hasPassword = ref.watch(accountHasPasswordProvider);
    final title = hasPassword ? 'Mot de passe' : 'Créer un mot de passe';

    final decoration = InputDecoration(
      filled: true,
      fillColor: s.surfaceContainerHighest.withValues(alpha: 0.5),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: s.primary, width: 2),
      ),
      prefixIcon: const Icon(Icons.lock_outlined),
      suffixIcon: IconButton(
        icon: Icon(
          _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
        ),
        tooltip: _obscure
            ? 'Afficher les mots de passe'
            : 'Masquer les mots de passe',
        onPressed: () => setState(() => _obscure = !_obscure),
      ),
    );

    return Scaffold(
      backgroundColor: s.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: s.surface,
            surfaceTintColor: s.surface,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              tooltip: 'Retour',
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text(
              title,
              style: AppFonts.sans(
                color: s.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 80),
            sliver: SliverToBoxAdapter(
              child: AutofillGroup(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        hasPassword
                            ? 'Saisissez votre mot de passe actuel, puis le '
                                  'nouveau. Il servira dans l’application et '
                                  'sur le site.'
                            : 'Vous vous connectez avec Google ou Apple. Un '
                                  'mot de passe vous permet aussi de vous '
                                  'connecter avec votre e-mail, dans '
                                  'l’application et sur le site.',
                        style: AppFonts.sans(
                          fontSize: 16,
                          height: 1.5,
                          color: s.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 24),
                      if (hasPassword) ...[
                        TextFormField(
                          controller: _current,
                          obscureText: _obscure,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.password],
                          decoration: decoration.copyWith(
                            labelText: 'Mot de passe actuel',
                          ),
                          validator: (value) => (value ?? '').isEmpty
                              ? 'Saisissez votre mot de passe actuel.'
                              : null,
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: _saving ? null : _openForgotPassword,
                            child: const Text('Mot de passe oublié ?'),
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                      TextFormField(
                        controller: _next,
                        obscureText: _obscure,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.newPassword],
                        decoration: decoration.copyWith(
                          labelText: 'Nouveau mot de passe',
                          helperText:
                              'Au moins $kMinPasswordLength caractères.',
                        ),
                        validator: (value) {
                          final next = value ?? '';
                          return next.length < kMinPasswordLength
                              ? newPasswordProblem(next, next)
                              : null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _confirmation,
                        obscureText: _obscure,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.newPassword],
                        onFieldSubmitted: (_) =>
                            _saving ? null : _save(service),
                        decoration: decoration.copyWith(
                          labelText: 'Confirmer le nouveau mot de passe',
                        ),
                        validator: (value) =>
                            _next.text.length < kMinPasswordLength
                            ? null
                            : newPasswordProblem(_next.text, value ?? ''),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          style: AppFonts.sans(
                            fontSize: 15,
                            height: 1.4,
                            color: s.error,
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: _saving ? null : () => _save(service),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: AppFonts.sans(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        child: _saving
                            ? SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: s.onPrimary,
                                ),
                              )
                            : const Text('Enregistrer'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
