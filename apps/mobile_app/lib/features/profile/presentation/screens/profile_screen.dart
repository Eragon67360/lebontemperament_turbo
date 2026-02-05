import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_app/core/constants/ui_constants.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../../../notifications/presentation/screens/notification_settings_screen.dart';
import 'about_screen.dart';
import 'support_contact_screen.dart';
import 'theme_settings_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isSuperadminAsync = ref.watch(isSuperadminProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: CustomScrollView(
        slivers: [
          // --- Dynamic Profile Header ---
          _ProfileAppBar(
            onLogout: () async {
              try {
                await ref.read(authControllerProvider.notifier).signOut();
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                          'Erreur lors de la déconnexion: ${e.toString()}'),
                    ),
                  );
                }
              }
            },
          ),

          // --- Content Sections ---
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  // --- 1. Général ---
                  const FadeInUp(
                      delay: 100, child: _SectionTitle(title: 'Général')),
                  const SizedBox(height: 12),
                  FadeInUp(
                    delay: 150,
                    child: _SettingsGroup(
                      children: [
                        _SettingsTile(
                          icon: Icons.notifications_outlined,
                          title: 'Notifications',
                          subtitle: 'Gérer les alertes et préférences',
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  const NotificationSettingsScreen(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),
                  const FadeInUp(
                      delay: 200, child: _SectionTitle(title: 'Application')),
                  const SizedBox(height: 12),
                  FadeInUp(
                    delay: 300,
                    child: _SettingsGroup(
                      children: [
                        _SettingsTile(
                          icon: Icons.palette_outlined,
                          title: 'Thème',
                          subtitle: 'Apparence de l\'application',
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const ThemeSettingsScreen(),
                            ),
                          ),
                        ),
                        _SettingsTile(
                          icon: Icons.info_outline_rounded,
                          title: 'À propos',
                          subtitle: 'Version et crédits',
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const AboutScreen(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // --- 3. Superadmin Section (Conditional) ---
                  if (isSuperadminAsync.valueOrNull == true) ...[/* ... */],

                  // --- 3. Support ---
                  const SizedBox(height: 32),
                  const FadeInUp(
                      delay: 400, child: _SectionTitle(title: 'Support')),
                  const SizedBox(height: 12),
                  FadeInUp(
                    delay: 500,
                    child: _SettingsGroup(
                      children: [
                        _SettingsTile(
                          icon: Icons.help_outline_rounded,
                          title: 'Aide & Contact',
                          subtitle: 'Contacter le support',
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const SupportContactScreen(),
                            ),
                          ),
                        ),
                        _SettingsTile(
                          icon: Icons.shield_outlined,
                          title: 'Politique de confidentialité',
                          subtitle: 'Consulter nos engagements',
                          onTap: () async {
                            final uri = Uri.parse(kPrivacyPolicyUrl);
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri,
                                  mode: LaunchMode.externalApplication);
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Impossible d\'ouvrir la page.')),
                              );
                            }
                          },
                        ),
                      ],
                    ),
                  ),

                  // --- 4. Danger Zone ---
                  const SizedBox(height: 32),
                  const FadeInUp(
                      delay: 600,
                      child: _SectionTitle(title: 'Zone de Danger')),
                  const SizedBox(height: 12),
                  FadeInUp(
                    delay: 700,
                    child: _SettingsGroup(
                      children: [
                        _SettingsTile(
                          icon: Icons.delete_outline_rounded,
                          title: 'Supprimer le compte',
                          subtitle: 'Action irréversible',
                          iconColor: Colors.red,
                          titleColor: Colors.red,
                          onTap: () => _showDeleteAccountConfirmation(context),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: kFloatingNavBarBottomPadding + 60),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

const String _kSupportEmail = 'contactlebontemperament@gmail.com';

Future<void> _showDeleteAccountConfirmation(BuildContext context) async {
  final contactSupport = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Supprimer le compte'),
      content: const Text(
        'Pour supprimer définitivement votre compte, contactez-nous par email. '
        'Cette action est irréversible.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Annuler'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          child: const Text('Contacter le support'),
        ),
      ],
    ),
  );
  if (contactSupport == true && context.mounted) {
    final uri = Uri(
      scheme: 'mailto',
      path: _kSupportEmail,
      query:
          _encodeQueryParameters(subject: 'Demande de suppression de compte'),
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}

String? _encodeQueryParameters({required String subject}) {
  return Uri(queryParameters: {'subject': subject}).query;
}

// MARK: - UI Components

class _ProfileAppBar extends ConsumerWidget {
  final VoidCallback onLogout;
  const _ProfileAppBar({required this.onLogout});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final displayName = ref.watch(displayNameProvider);
    final theme = Theme.of(context);

    return SliverAppBar(
      backgroundColor: theme.colorScheme.surface,
      surfaceTintColor: theme.colorScheme.surface,
      pinned: true,
      expandedHeight: 220.0,
      actions: [
        IconButton(
          icon: const Icon(Icons.logout_outlined),
          color: theme.colorScheme.onSurfaceVariant,
          tooltip: 'Déconnexion',
          onPressed: onLogout,
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        centerTitle: false,
        titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        title: Text(
          displayName,
          style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
        background: const _ProfileHeader(),
      ),
    );
  }
}

class _ProfileHeader extends ConsumerWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final displayName = ref.watch(displayNameProvider);
    final theme = Theme.of(context);
    final initials = displayName.isNotEmpty
        ? displayName
            .trim()
            .split(' ')
            .map((l) => l[0])
            .take(2)
            .join()
            .toUpperCase()
        : '?';

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.surface,
            theme.colorScheme.surfaceVariant.withOpacity(0.5),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 50),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: theme.colorScheme.primary,
              child: Text(
                initials,
                style: GoogleFonts.poppins(
                  color: theme.colorScheme.onPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user?.email ?? '',
              style: GoogleFonts.poppins(
                fontSize: 16,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final List<Widget> children;
  const _SettingsGroup({required this.children});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
      ),
      child: Column(
        children: List.generate(children.length * 2 - 1, (index) {
          if (index.isEven) {
            return children[index ~/ 2];
          }
          return Divider(
            height: 1,
            thickness: 1,
            indent: 60,
            color: theme.colorScheme.outline.withOpacity(0.2),
          );
        }),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String title;
  final Color? titleColor;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    this.iconColor,
    required this.title,
    this.titleColor,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                  color: theme.colorScheme.surface, shape: BoxShape.circle),
              child: Icon(icon,
                  color: iconColor ?? theme.colorScheme.primary, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: titleColor ?? theme.colorScheme.onSurface)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Icon(Icons.arrow_forward_ios_rounded,
                size: 16,
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7)),
          ],
        ),
      ),
    );
  }
}

class FadeInUp extends StatefulWidget {
  final Widget child;
  final int delay;
  const FadeInUp({super.key, required this.child, this.delay = 0});
  @override
  State<FadeInUp> createState() => _FadeInUpState();
}

class _FadeInUpState extends State<FadeInUp>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<double> _translateY;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _opacity = Tween<double>(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _translateY = Tween<double>(begin: 30.0, end: 0.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Opacity(
        opacity: _opacity.value,
        child: Transform.translate(
            offset: Offset(0, _translateY.value), child: widget.child),
      ),
    );
  }
}
