import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart'; // Add google_fonts to pubspec.yaml
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart'; // For french date formatting
import 'package:lebontemperament/core/constants/ui_constants.dart';

import '../../../../data/models/concert.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../widgets/concert_anniversaire_section.dart';

class ConcertsScreen extends ConsumerStatefulWidget {
  const ConcertsScreen({super.key});

  @override
  ConsumerState<ConcertsScreen> createState() => _ConcertsScreenState();
}

class _ConcertsScreenState extends ConsumerState<ConcertsScreen> {
  @override
  void initState() {
    super.initState();
    // Ensure the French locale is initialized for date formatting
    initializeDateFormatting('fr_FR');
  }

  Future<void> _onRefresh() async {
    // Invalidate providers to refetch data
    ref.invalidate(realtimeConcertsProvider);
    ref.invalidate(refreshTriggerProvider);
  }

  @override
  Widget build(BuildContext context) {
    final concertsAsync = ref.watch(upcomingConcertsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surfaceContainerHighest,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // --- 1. Dynamic App Bar ---
            _ConcertsAppBar(
              onLogout: () async {
                try {
                  await ref.read(authServiceProvider).signOut();
                  if (mounted) context.go('/login');
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Erreur lors de la déconnexion: $e'),
                        backgroundColor: theme.colorScheme.error,
                      ),
                    );
                  }
                }
              },
            ),

            // --- 2. Main Content based on State ---
            concertsAsync.when(
              data: (concerts) {
                final itemCount = concerts.isEmpty ? 2 : concerts.length + 1;
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    20,
                    10,
                    20,
                    kFloatingNavBarBottomPadding,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate((context, index) {
                      if (concerts.isEmpty) {
                        if (index == 0) return const _EmptyState();
                        if (index == 1) {
                          return const ConcertAnniversaireSection();
                        }
                      } else {
                        if (index < concerts.length) {
                          final concert = concerts[index];
                          return FadeInUp(
                            delay: 100 + (index * 50),
                            child: _ConcertCard(
                              concert: concert,
                              isLast: false,
                            ),
                          );
                        }
                        if (index == concerts.length) {
                          return const ConcertAnniversaireSection();
                        }
                      }
                      return null;
                    }, childCount: itemCount),
                  ),
                );
              },
              loading: () => const SliverFillRemaining(child: _LoadingState()),
              error: (error, stack) => SliverFillRemaining(
                hasScrollBody: false,
                child: _ErrorState(onRetry: _onRefresh),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - UI Components

class _ConcertsAppBar extends StatelessWidget {
  final VoidCallback onLogout;
  const _ConcertsAppBar({required this.onLogout});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SliverAppBar(
      backgroundColor: theme.colorScheme.surface,
      surfaceTintColor: theme.colorScheme.surface,
      pinned: true,
      floating: true,
      expandedHeight: 120.0,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        centerTitle: false,
        title: Text(
          'Concerts à venir',
          style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 12.0),
          child: IconButton(
            icon: const Icon(Icons.logout_outlined),
            color: theme.colorScheme.onSurfaceVariant,
            tooltip: 'Déconnexion',
            onPressed: () {
              HapticFeedback.lightImpact();
              onLogout();
            },
          ),
        ),
      ],
    );
  }
}

class _ConcertCard extends StatelessWidget {
  final Concert concert;
  final bool isLast;

  const _ConcertCard({required this.concert, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Date parsing logic
    String day = '-';
    String month = '-';
    if (concert.date.isNotEmpty) {
      try {
        final dateTime = DateTime.parse(concert.date);
        day = DateFormat('d', 'fr_FR').format(dateTime);
        month = DateFormat('MMM', 'fr_FR').format(dateTime).toUpperCase();
      } catch (e) {
        // Handle potential parsing error if date format is unexpected
      }
    }

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          context.push('/concerts/${concert.id}');
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.5,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: theme.colorScheme.outline.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              // --- Date Section ---
              SizedBox(
                width: 55,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      month,
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      day,
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.onSurface,
                        fontWeight: FontWeight.bold,
                        fontSize: 32,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Container(
                width: 1,
                height: 60,
                color: theme.colorScheme.outline.withValues(alpha: 0.3),
              ),
              const SizedBox(width: 16),

              // --- Details Section ---
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      concert.name ?? 'Concert sans titre',
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                        fontSize: 17,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    _InfoRow(
                      icon: Icons.location_on_outlined,
                      text: concert.place.isNotEmpty
                          ? concert.place
                          : 'Lieu non spécifié',
                    ),
                    if (concert.time.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      _InfoRow(
                        icon: Icons.access_time_outlined,
                        text: _formatTime(concert.time),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(String time) {
    try {
      final timeParts = time.split(':');
      if (timeParts.length >= 2) {
        return '${timeParts[0]}h${timeParts[1]}';
      }
    } catch (e) {
      // Return original time if format is unexpected
    }
    return time;
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.onSurfaceVariant, size: 14),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.poppins(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 13,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// MARK: - State Handling Widgets

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.music_off_outlined,
                size: 72,
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.5,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Aucun concert à venir',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Les prochains concerts organisés par votre association apparaîtront ici.',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.cloud_off_outlined,
                size: 72,
                color: theme.colorScheme.error.withValues(alpha: 0.7),
              ),
              const SizedBox(height: 24),
              Text(
                'Oups, une erreur est survenue',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Nous n\'avons pas pu charger les concerts. Vérifiez votre connexion et réessayez.',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: FilledButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// MARK: - Animation Widget (Same as before)
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
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _opacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _translateY = Tween<double>(
      begin: 30.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
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
      builder: (context, child) {
        return Opacity(
          opacity: _opacity.value,
          child: Transform.translate(
            offset: Offset(0, _translateY.value),
            child: widget.child,
          ),
        );
      },
    );
  }
}
