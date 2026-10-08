import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../../data/models/rehearsal.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../notifications/presentation/screens/notification_settings_screen.dart';
import '../../../../data/providers/my_groups_provider.dart';
import '../../data/welcome_prefs.dart';
import '../widgets/my_groups_picker.dart';

/// The welcome tour (« Portée »), shown once after the first sign-in and
/// from Profil › Revoir la visite: a welcome, the member's ensembles (the
/// home screen and the calendar follow them), one page per part of the app
/// and the reminders.
/// « Passer » is always there, and every page scrolls at large text sizes.
class WelcomeTourScreen extends ConsumerStatefulWidget {
  const WelcomeTourScreen({super.key});

  @override
  ConsumerState<WelcomeTourScreen> createState() => _WelcomeTourScreenState();
}

class _WelcomeTourScreenState extends ConsumerState<WelcomeTourScreen> {
  final _controller = PageController();
  int _page = 0;
  Set<GroupType> _groups = const {};
  bool _groupsLoaded = false;

  static const _pageCount = 7;

  /// Pages after the welcome count as steps 1 to 6.
  static const _steps = _pageCount - 1;

  @override
  void initState() {
    super.initState();
    WelcomePrefs.myGroups().then((g) {
      if (mounted) {
        setState(() {
          _groups = g;
          _groupsLoaded = true;
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _goTo(int page) {
    HapticFeedback.selectionClick();
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    if (reduceMotion) {
      _controller.jumpToPage(page);
    } else {
      _controller.animateToPage(
        page,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    }
  }

  /// Ends the tour: remembers it, applies the ensembles only when the
  /// member went through that page, and goes back to where the tour was
  /// opened.
  Future<void> _finish({bool applyGroup = true}) async {
    await WelcomePrefs.markTourSeen();
    // The tour's last section page already tells about signalements.
    await WelcomePrefs.markTipSeen(kReportProblemTipId);
    if (applyGroup && _groupsLoaded) {
      await ref.read(myGroupsProvider.notifier).set(_groups);
    }
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/main');
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final displayName = ref.watch(displayNameProvider);
    final firstName = displayName.trim().split(RegExp(r'\s+')).first;

    final pages = <Widget>[
      _WelcomePage(firstName: firstName),
      _GroupPage(
        selected: _groups,
        onChanged: (g) => setState(() {
          _groups = g;
          _groupsLoaded = true;
        }),
      ),
      const _SectionPage(
        icon: Icons.home_outlined,
        place: 'Onglet Accueil',
        title: 'L’accueil, votre prochain rendez-vous',
        points: [
          (
            Icons.schedule_outlined,
            'La prochaine répétition de vos ensembles, avec l’heure et le '
                'lieu.',
          ),
          (
            Icons.directions_outlined,
            'L’itinéraire en un geste, et votre semaine dessinée sur une '
                'portée.',
          ),
          (
            Icons.library_music_outlined,
            'Les raccourcis (partitions, membres, administration), puis le '
                'prochain concert.',
          ),
        ],
      ),
      const _SectionPage(
        icon: Icons.calendar_month_outlined,
        place: 'Onglet Calendrier',
        title: 'Le calendrier des répétitions',
        points: [
          (
            Icons.circle,
            'Chaque ensemble a sa couleur : vos répétitions se repèrent d’un '
                'coup d’œil.',
          ),
          (
            Icons.filter_list_rounded,
            'En haut de la liste, cliquez sur les ensembles à afficher : vos '
                'ensembles sont cochés d’office.',
          ),
          (
            Icons.event_note_outlined,
            'Le bouton calendrier ouvre l’agenda complet de l’association.',
          ),
        ],
      ),
      const _SectionPage(
        icon: Icons.library_music_outlined,
        place: 'Depuis l’accueil',
        title: 'Partitions et enregistrements',
        points: [
          (
            Icons.folder_outlined,
            'Les partitions de chaque programme, rangées par ensemble.',
          ),
          (
            Icons.headphones_outlined,
            'Écoutez les enregistrements pour travailler votre voix.',
          ),
          (
            Icons.download_outlined,
            'Téléchargez un fichier pour le garder sur votre téléphone.',
          ),
        ],
      ),
      const _SectionPage(
        icon: Icons.groups_outlined,
        place: 'Concerts, Membres et Profil',
        title: 'Les concerts, et toute la troupe',
        points: [
          (
            Icons.event_outlined,
            'Concerts : dates, lieux et détails des concerts et des '
                'événements.',
          ),
          (
            Icons.group_outlined,
            'Membres : retrouvez quelqu’un par son nom ou sa voix, appelez-le '
                'ou écrivez-lui.',
          ),
          (
            Icons.person_outline,
            'Profil : thème clair ou sombre, notifications, aide.',
          ),
          (
            Icons.flag_outlined,
            'Un souci dans l’application ? Profil › « Signaler un problème », '
                'avec une capture d’écran si vous voulez : on vous répond ici, '
                'avec une notification.',
          ),
        ],
      ),
      const _RemindersPage(),
    ];

    final isLast = _page == _pageCount - 1;
    final cta = switch (_page) {
      0 => 'Faire la visite',
      1 => 'Continuer',
      _ when isLast => 'C’est parti',
      _ => 'Suivant',
    };

    return Scaffold(
      backgroundColor: s.surface,
      body: SafeArea(
        child: Column(
          children: [
            // Back, progress and « Passer ».
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 12, 0),
              child: SizedBox(
                height: 48,
                child: Row(
                  children: [
                    SizedBox(
                      width: 48,
                      child: _page > 0
                          ? IconButton(
                              tooltip: 'Retour',
                              icon: const Icon(Icons.arrow_back_rounded),
                              onPressed: () => _goTo(_page - 1),
                            )
                          : null,
                    ),
                    Expanded(
                      child: _page > 0
                          ? _Progress(step: _page, steps: _steps)
                          : const SizedBox.shrink(),
                    ),
                    SizedBox(
                      width: 72,
                      // The welcome page has « Plus tard » at the bottom.
                      child: isLast || _page == 0
                          ? null
                          : TextButton(
                              onPressed: () => _finish(applyGroup: _page > 1),
                              child: const Text('Passer'),
                            ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: PageView(
                controller: _controller,
                onPageChanged: (p) => setState(() => _page = p),
                children: pages,
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FilledButton(
                    onPressed: isLast
                        ? () => _finish()
                        : () => _goTo(_page + 1),
                    child: Text(cta),
                  ),
                  if (_page == 0)
                    TextButton(
                      onPressed: () => _finish(applyGroup: false),
                      child: const Text('Plus tard'),
                    ),
                  if (isLast)
                    TextButton(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const NotificationSettingsScreen(),
                        ),
                      ),
                      child: const Text('Régler mes rappels'),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Step dots: done and current in the accent, the current one longer.
class _Progress extends StatelessWidget {
  const _Progress({required this.step, required this.steps});
  final int step;
  final int steps;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Semantics(
      label: 'Étape $step sur $steps',
      child: ExcludeSemantics(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var i = 1; i <= steps; i++)
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: i == step ? 18 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i <= step ? s.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(3),
                  border: i <= step ? null : Border.all(color: s.outline),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// A page's text column, scrollable so large text never clips.
class _PageBody extends StatelessWidget {
  const _PageBody({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    ),
  );
}

class _Title extends StatelessWidget {
  const _Title(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: Text(
      text,
      style: AppFonts.display(
        fontSize: 28,
        fontWeight: FontWeight.w500,
        color: Theme.of(context).colorScheme.onSurface,
        height: 1.15,
      ),
    ),
  );
}

class _Lead extends StatelessWidget {
  const _Lead(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: AppFonts.sans(
      fontSize: 17,
      height: 1.5,
      color: Theme.of(context).colorScheme.onSurfaceVariant,
    ),
  );
}

class _Hint extends StatelessWidget {
  const _Hint(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: AppFonts.sans(
      fontSize: 13,
      color: Theme.of(context).colorScheme.onSurfaceVariant,
    ),
  );
}

/// Five hairlines with the section's icon in a hairline circle on them, or
/// four rising notes on the welcome page.
class _StaffArt extends StatelessWidget {
  const _StaffArt({this.icon});
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return ExcludeSemantics(
      child: SizedBox(
        width: double.infinity,
        height: 140,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(
              child: CustomPaint(
                painter: _TourStaffPainter(
                  line: s.outlineVariant,
                  note: s.primary,
                  withNotes: icon == null,
                ),
              ),
            ),
            if (icon != null)
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: s.surface,
                  shape: BoxShape.circle,
                  border: Border.all(color: s.primary),
                ),
                child: Icon(icon, color: s.primary, size: 34),
              ),
          ],
        ),
      ),
    );
  }
}

class _TourStaffPainter extends CustomPainter {
  _TourStaffPainter({
    required this.line,
    required this.note,
    required this.withNotes,
  });

  final Color line;
  final Color note;
  final bool withNotes;

  @override
  void paint(Canvas canvas, Size size) {
    const gap = 12.0;
    final top = size.height / 2 - 2 * gap;
    final hair = Paint()
      ..color = line
      ..strokeWidth = 1;
    for (var i = 0; i < 5; i++) {
      canvas.drawLine(
        Offset(0, top + i * gap),
        Offset(size.width, top + i * gap),
        hair,
      );
    }
    if (!withNotes) return;
    final fill = Paint()..color = note;
    final stem = Paint()
      ..color = note
      ..strokeWidth = 1.6;
    for (var i = 0; i < 4; i++) {
      final cx = size.width * (0.25 + i * 0.17);
      final cy = top + (4 - i) * gap - gap / 2;
      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(-0.35);
      final head = Rect.fromCenter(center: Offset.zero, width: 18, height: 13);
      if (i == 3) {
        canvas.drawOval(
          head,
          Paint()
            ..color = note
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.6,
        );
      } else {
        canvas.drawOval(head, fill);
      }
      canvas.restore();
      canvas.drawLine(Offset(cx + 8, cy - 2), Offset(cx + 8, cy - 46), stem);
    }
  }

  @override
  bool shouldRepaint(_TourStaffPainter old) =>
      old.line != line || old.note != note || old.withNotes != withNotes;
}

class _WelcomePage extends StatelessWidget {
  const _WelcomePage({required this.firstName});
  final String firstName;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return _PageBody(
      children: [
        const StageEyebrow('Le Bon Tempérament'),
        const SizedBox(height: 24),
        const _StaffArt(),
        const SizedBox(height: 32),
        _Title(
          firstName.isEmpty
              ? 'Bienvenue dans les coulisses'
              : 'Bienvenue dans les coulisses, $firstName',
        ),
        const SizedBox(height: 16),
        const _Lead(
          'En deux minutes, on vous montre où trouver vos répétitions, vos '
          'partitions et les concerts. Pas de solfège à réviser, promis.',
        ),
        const SizedBox(height: 16),
        Text(
          'La visite reste disponible dans Profil › Revoir la visite.',
          style: AppFonts.sans(fontSize: 13, color: s.onSurfaceVariant),
        ),
      ],
    );
  }
}

class _GroupPage extends StatelessWidget {
  const _GroupPage({required this.selected, required this.onChanged});
  final Set<GroupType> selected;
  final ValueChanged<Set<GroupType>> onChanged;

  @override
  Widget build(BuildContext context) {
    return _PageBody(
      children: [
        const SizedBox(height: 8),
        const _Title('Quels sont vos ensembles ?'),
        const SizedBox(height: 12),
        const _Lead(
          'Cochez-en autant que vous voulez. L’accueil et le calendrier '
          'montreront leurs répétitions, avec celles du chœur complet et de '
          'tout le monde. Rien de coché : vous verrez toute la saison.',
        ),
        const SizedBox(height: 20),
        MyGroupsPicker(selected: selected, onChanged: onChanged),
        const SizedBox(height: 12),
        const _Hint('Modifiable à tout moment dans Profil › Mes ensembles.'),
      ],
    );
  }
}

class _SectionPage extends StatelessWidget {
  const _SectionPage({
    required this.icon,
    required this.place,
    required this.title,
    required this.points,
  });

  final IconData icon;

  /// Where the section lives (« Onglet Calendrier »).
  final String place;
  final String title;
  final List<(IconData, String)> points;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return _PageBody(
      children: [
        _StaffArt(icon: icon),
        const SizedBox(height: 24),
        StageEyebrow(place),
        const SizedBox(height: 8),
        _Title(title),
        const SizedBox(height: 20),
        for (final (pointIcon, text) in points)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: s.outlineVariant),
                  ),
                  child: Icon(
                    pointIcon,
                    size: pointIcon == Icons.circle ? 10 : 18,
                    color: s.primary,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      text,
                      style: AppFonts.sans(
                        fontSize: 17,
                        height: 1.45,
                        color: s.onSurface,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _RemindersPage extends StatelessWidget {
  const _RemindersPage();

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return _PageBody(
      children: [
        const _StaffArt(icon: Icons.notifications_none_rounded),
        const SizedBox(height: 24),
        // What a reminder looks like.
        ExcludeSemantics(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: s.outlineVariant),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.library_music_outlined, color: s.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Répétition demain, 20 h',
                        style: AppFonts.sans(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: s.onSurface,
                        ),
                      ),
                      Text(
                        'Chœur complet · Salle de musique',
                        style: AppFonts.sans(
                          fontSize: 14,
                          color: s.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        const _Title('Un petit rappel avant chaque répétition ?'),
        const SizedBox(height: 12),
        const _Lead(
          'Pour ne plus arriver pendant le Kyrie. L’application peut vous '
          'prévenir avant les répétitions et les concerts : tout se règle '
          'dans Profil › Notifications.',
        ),
      ],
    );
  }
}
