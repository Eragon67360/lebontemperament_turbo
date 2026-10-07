import 'package:flutter/material.dart';
import 'dart:ui' as ui;
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/confirm_logout_dialog.dart';
import 'package:lebontemperament/core/widgets/pdf_viewer_sheet.dart';
import 'package:lebontemperament/data/constants/pdf_archives.dart';
import 'package:lebontemperament/data/models/ca_minute.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';

/// Measures label width (at the member's text size) to decide 1 vs 2
/// columns. Chip has ~52px fixed (icon+padding).
double _measureLabelWidth(String label, TextScaler textScaler) {
  final painter = TextPainter(
    text: TextSpan(
      text: label,
      style: AppFonts.sans(fontSize: 13, fontWeight: FontWeight.w500),
    ),
    maxLines: 1,
    textScaler: textScaler,
    textDirection: ui.TextDirection.ltr,
  )..layout();
  return painter.width;
}

/// Returns itemWidth for Wrap: full width for long labels, half for short.
double _computeItemWidth(
  double maxWidth,
  List<String> labels,
  TextScaler textScaler,
) {
  const spacing = 8.0;
  const chipFixedWidth = 52.0; // icon + padding
  final halfWidth = (maxWidth - spacing) / 2;

  if (labels.isEmpty) return halfWidth;

  final maxLabelWidth = labels
      .map((l) => _measureLabelWidth(l, textScaler))
      .reduce((a, b) => a > b ? a : b);
  final chipWidth = chipFixedWidth + maxLabelWidth;

  return chipWidth > halfWidth ? maxWidth : halfWidth;
}

class AdministrationScreen extends ConsumerStatefulWidget {
  const AdministrationScreen({super.key});

  @override
  ConsumerState<AdministrationScreen> createState() =>
      _AdministrationScreenState();
}

class _AdministrationScreenState extends ConsumerState<AdministrationScreen> {
  int _selectedTabIndex = 0;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        backgroundColor: theme.colorScheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          tooltip: 'Retour',
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: Text(
          'Administration',
          style: AppFonts.sans(
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Déconnexion',
            onPressed: () async {
              HapticFeedback.lightImpact();
              if (!await confirmLogout(context)) return;
              try {
                await ref.read(authServiceProvider).signOut();
                if (!context.mounted) return;
                context.go('/login');
              } catch (_) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text(kLogoutFailedMessage),
                    backgroundColor: theme.colorScheme.error,
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _TabBar(
            selectedIndex: _selectedTabIndex,
            onTap: (i) {
              HapticFeedback.lightImpact();
              setState(() => _selectedTabIndex = i);
            },
          ),
          Expanded(
            child: IndexedStack(
              index: _selectedTabIndex,
              children: const [
                _ArchivesTab(),
                _ReglementTab(),
                _LogicielsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTap;

  const _TabBar({required this.selectedIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tabs = ['Archives', 'Règlement', 'Logiciels'];

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
      ),
      child: Row(
        children: List.generate(tabs.length, (i) {
          final isSelected = i == selectedIndex;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Material(
                color: isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surfaceContainerHighest.withValues(
                        alpha: 0.5,
                      ),
                borderRadius: BorderRadius.circular(12),
                child: Semantics(
                  button: true,
                  selected: isSelected,
                  label: tabs[i],
                  child: InkWell(
                    onTap: () => onTap(i),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      // 48 dp target.
                      constraints: const BoxConstraints(minHeight: 48),
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(
                        vertical: 8,
                        horizontal: 4,
                      ),
                      child: ExcludeSemantics(
                        // Shrinks a long label at large text sizes rather
                        // than breaking it in the middle of the word.
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            tabs[i],
                            maxLines: 1,
                            textAlign: TextAlign.center,
                            style: AppFonts.sans(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? theme.colorScheme.onPrimary
                                  : theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _ArchivesTab extends ConsumerWidget {
  const _ArchivesTab();

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  void _showPdfSheet(BuildContext context, String url, String fileName) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => PdfViewerSheet(
        url: url,
        fileName: fileName,
        onClose: () => Navigator.of(ctx).pop(),
        onOpenInBrowser: (u) => _launchUrl(u),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final caAsync = ref.watch(caMinutesProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(caMinutesProvider),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CaArchiveSection(
              caAsync: caAsync,
              onLaunchUrl: _launchUrl,
              onShowPdfSheet: _showPdfSheet,
              formatDate: _formatDate,
            ),
            const SizedBox(height: 24),
            _ExpandablePdfArchiveSection(
              title: 'Comptes-rendus AG',
              subtitle: 'Archives des assemblées générales',
              entries: kAgPdfs,
              pdfContext: 'AG',
              labelBuilder: (e) => 'AG ${_formatPdfDate(e.date)}',
              onLaunchUrl: _launchUrl,
              onShowPdfSheet: _showPdfSheet,
            ),
            const SizedBox(height: 24),
            _ExpandablePdfArchiveSection(
              title: 'Gazettes',
              subtitle: 'Archives des gazettes',
              entries: kGazettesPdfs,
              pdfContext: 'Gazettes',
              labelBuilder: (e) =>
                  e.title ?? 'Gazette ${_formatPdfDate(e.date)}',
              onLaunchUrl: _launchUrl,
              onShowPdfSheet: _showPdfSheet,
            ),
            const SizedBox(height: 24),
            _ExpandablePdfArchiveSection(
              title: 'Pêle-Mêle',
              subtitle: 'Archives diverses',
              entries: kPmPdfs,
              pdfContext: 'PM',
              labelBuilder: (e) => 'N°${e.date}',
              onLaunchUrl: _launchUrl,
              onShowPdfSheet: _showPdfSheet,
            ),
            const SizedBox(height: kFloatingNavBarBottomPadding),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy', 'fr_FR').format(d);
    } catch (_) {
      return dateStr;
    }
  }

  String _formatPdfDate(String dateStr) {
    if (dateStr.length == 4 && RegExp(r'^\d{4}$').hasMatch(dateStr)) {
      return dateStr;
    }
    if (dateStr.length == 1) return dateStr;
    final parts = dateStr.split('-');
    if (parts.length == 3) return '${parts[0]}/${parts[1]}/${parts[2]}';
    return dateStr;
  }
}

class _CaArchiveSection extends ConsumerStatefulWidget {
  final AsyncValue<List<CaMinute>> caAsync;
  final void Function(String) onLaunchUrl;
  final void Function(BuildContext, String, String) onShowPdfSheet;
  final String Function(String) formatDate;

  const _CaArchiveSection({
    required this.caAsync,
    required this.onLaunchUrl,
    required this.onShowPdfSheet,
    required this.formatDate,
  });

  @override
  ConsumerState<_CaArchiveSection> createState() => _CaArchiveSectionState();
}

class _CaArchiveSectionState extends ConsumerState<_CaArchiveSection> {
  static const int _initialCount = 5;
  bool _showAll = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return _ArchiveSection(
      title: 'Comptes-rendus CA',
      subtitle: 'Archives des réunions du conseil d\'administration',
      child: widget.caAsync.when(
        data: (minutes) {
          if (minutes.isEmpty) {
            return Text(
              'Aucun compte-rendu disponible',
              style: AppFonts.sans(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 14,
              ),
            );
          }
          final displayCount = _showAll
              ? minutes.length
              : minutes.length.clamp(0, _initialCount);
          final displayed = minutes.take(displayCount).toList();
          final remaining = minutes.length - _initialCount;

          return LayoutBuilder(
            builder: (context, constraints) {
              const spacing = 8.0;
              final labels = displayed
                  .map((m) => 'CA du ${widget.formatDate(m.dateFrom)}')
                  .toList();
              final itemWidth = _computeItemWidth(
                constraints.maxWidth,
                labels,
                MediaQuery.textScalerOf(context),
              );
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: spacing,
                    runSpacing: spacing,
                    children: displayed.map((m) {
                      final url = m.fileUrl;
                      final label = 'CA du ${widget.formatDate(m.dateFrom)}';
                      return SizedBox(
                        width: itemWidth,
                        child: _PdfChip(
                          label: label,
                          url: url,
                          onShowPdfSheet: widget.onShowPdfSheet,
                        ),
                      );
                    }).toList(),
                  ),
                  if (remaining > 0 && !_showAll) ...[
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: () => setState(() => _showAll = true),
                      icon: const Icon(Icons.expand_more, size: 18),
                      label: Text(
                        'Afficher les $remaining autres',
                        style: AppFonts.sans(fontSize: 14),
                      ),
                    ),
                  ],
                  if (_showAll && minutes.length > _initialCount) ...[
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: () => setState(() => _showAll = false),
                      icon: const Icon(Icons.expand_less, size: 18),
                      label: Text(
                        'Réduire',
                        style: AppFonts.sans(fontSize: 14),
                      ),
                    ),
                  ],
                ],
              );
            },
          );
        },
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: Center(child: CircularProgressIndicator()),
        ),
        error: (e, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Impossible de charger les comptes-rendus. Vérifiez votre connexion et réessayez.',
              style: AppFonts.sans(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => ref.invalidate(caMinutesProvider),
              icon: const Icon(Icons.refresh, size: 18),
              label: Text('Réessayer', style: AppFonts.sans(fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExpandablePdfArchiveSection extends StatefulWidget {
  final String title;
  final String subtitle;
  final List<PdfArchiveEntry> entries;
  final String pdfContext;
  final String Function(PdfArchiveEntry) labelBuilder;
  final void Function(String) onLaunchUrl;
  final void Function(BuildContext, String, String) onShowPdfSheet;

  const _ExpandablePdfArchiveSection({
    required this.title,
    required this.subtitle,
    required this.entries,
    required this.pdfContext,
    required this.labelBuilder,
    required this.onLaunchUrl,
    required this.onShowPdfSheet,
  });

  @override
  State<_ExpandablePdfArchiveSection> createState() =>
      _ExpandablePdfArchiveSectionState();
}

class _ExpandablePdfArchiveSectionState
    extends State<_ExpandablePdfArchiveSection> {
  static const int _initialCount = 5;
  bool _showAll = false;

  @override
  Widget build(BuildContext context) {
    final entries = sortedByDateDesc(widget.entries);
    final displayCount = _showAll
        ? entries.length
        : entries.length.clamp(0, _initialCount);
    final displayed = entries.take(displayCount).toList();
    final remaining = entries.length - _initialCount;

    return _ArchiveSection(
      title: widget.title,
      subtitle: widget.subtitle,
      child: LayoutBuilder(
        builder: (context, constraints) {
          const spacing = 8.0;
          final labels = displayed.map(widget.labelBuilder).toList();
          final itemWidth = _computeItemWidth(
            constraints.maxWidth,
            labels,
            MediaQuery.textScalerOf(context),
          );
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: spacing,
                runSpacing: spacing,
                children: displayed.map((e) {
                  final url =
                      '$kWebsiteBaseUrl/pdf/${widget.pdfContext}/${Uri.encodeComponent(e.name)}';
                  final label = widget.labelBuilder(e);
                  return SizedBox(
                    width: itemWidth,
                    child: _PdfChip(
                      label: label,
                      url: url,
                      onShowPdfSheet: widget.onShowPdfSheet,
                    ),
                  );
                }).toList(),
              ),
              if (remaining > 0 && !_showAll) ...[
                const SizedBox(height: 4),
                TextButton.icon(
                  onPressed: () => setState(() => _showAll = true),
                  icon: const Icon(Icons.expand_more, size: 18),
                  label: Text(
                    'Afficher les $remaining autres',
                    style: AppFonts.sans(fontSize: 14),
                  ),
                ),
              ],
              if (_showAll && entries.length > _initialCount) ...[
                const SizedBox(height: 4),
                TextButton.icon(
                  onPressed: () => setState(() => _showAll = false),
                  icon: const Icon(Icons.expand_less, size: 18),
                  label: Text('Réduire', style: AppFonts.sans(fontSize: 14)),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _ArchiveSection extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;

  const _ArchiveSection({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.folder_open_outlined,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppFonts.sans(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: AppFonts.sans(
                        fontSize: 13,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _PdfChip extends StatelessWidget {
  final String label;
  final String? url;
  final void Function(BuildContext, String, String) onShowPdfSheet;

  const _PdfChip({
    required this.label,
    required this.url,
    required this.onShowPdfSheet,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasUrl = url != null && url!.isNotEmpty;

    return Material(
      color: theme.colorScheme.primary,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: hasUrl
            ? () {
                HapticFeedback.lightImpact();
                onShowPdfSheet(context, url!, label);
              }
            : null,
        borderRadius: BorderRadius.circular(8),
        // 48 dp tall at least; a long label wraps rather than vanishing.
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 48),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.max,
              children: [
                Icon(
                  Icons.picture_as_pdf,
                  size: 18,
                  color: theme.colorScheme.onPrimary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    label,
                    style: AppFonts.sans(
                      fontSize: 13,
                      color: theme.colorScheme.onPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ReglementTab extends StatelessWidget {
  const _ReglementTab();

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  void _showPdfSheet(BuildContext context, String path, String fileName) {
    final url = '$kWebsiteBaseUrl$path';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => PdfViewerSheet(
        url: url,
        fileName: fileName,
        onClose: () => Navigator.of(ctx).pop(),
        onOpenInBrowser: (u) => _launchUrl(u),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ReglementCard(
            title: 'Règlement intérieur',
            subtitle: 'Extrait du règlement intérieur',
            onTap: () => _showPdfSheet(
              context,
              '/pdf/reglement.pdf',
              'Règlement intérieur',
            ),
            extras: [
              _ReglementExtract(
                title: 'Répétitions',
                text:
                    'Le Bon Tempérament répète un dimanche par mois et part en tournée dix jours en été. Les répétitions de pupitres, hommes et femmes, ont lieu tous les 15 jours.',
              ),
              _ReglementExtract(
                title: 'Commission de solidarité',
                text:
                    'Une commission de solidarité est mise en place. Le fonds de solidarité est alimenté par des dons et par le produit de certaines manifestations auxquelles l\'association participe...',
              ),
            ],
          ),
          const SizedBox(height: 16),
          _ReglementCard(
            title: 'Charte des séjours',
            subtitle: 'Consultez la charte complète sur les séjours BT',
            onTap: () => _showPdfSheet(
              context,
              '/pdf/charte_BT.pdf',
              'Charte des séjours',
            ),
          ),
          const SizedBox(height: 16),
          _ReglementCard(
            title: 'Statuts de l\'association',
            subtitle: 'Consultez les statuts complets du Bon Tempérament',
            onTap: () => _showPdfSheet(
              context,
              '/pdf/Statuts_Le_Bon_Tempérament.pdf',
              'Statuts de l\'association',
            ),
          ),
          const SizedBox(height: kFloatingNavBarBottomPadding),
        ],
      ),
    );
  }
}

class _ReglementCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final List<Widget>? extras;

  const _ReglementCard({
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.extras,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.description_outlined,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: AppFonts.sans(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        Text(
                          subtitle,
                          style: AppFonts.sans(
                            fontSize: 13,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.open_in_new,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                ],
              ),
              if (extras != null) ...[const SizedBox(height: 16), ...extras!],
            ],
          ),
        ),
      ),
    );
  }
}

class _ReglementExtract extends StatelessWidget {
  final String title;
  final String text;

  const _ReglementExtract({required this.title, required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppFonts.sans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              text,
              style: AppFonts.sans(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LogicielsTab extends StatelessWidget {
  const _LogicielsTab();

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final categories = [
      _SoftwareCategory(
        title: 'Écouter',
        icon: Icons.headphones,
        items: [
          _SoftwareItem('VLC', 'https://www.videolan.org/vlc/'),
          _SoftwareItem('iTunes', 'https://www.apple.com/fr/itunes/'),
          _SoftwareItem(
            'Windows Media Player',
            'https://support.microsoft.com/fr-fr/windows',
          ),
        ],
      ),
      _SoftwareCategory(
        title: 'Consulter',
        icon: Icons.description_outlined,
        items: [
          _SoftwareItem('OpenOffice', 'https://www.openoffice.org/'),
          _SoftwareItem('Adobe Reader', 'https://get.adobe.com/fr/reader/'),
        ],
      ),
      _SoftwareCategory(
        title: 'Modifier',
        icon: Icons.edit_outlined,
        items: [
          _SoftwareItem('Musescore', 'https://musescore.org/fr'),
          _SoftwareItem('Audacity', 'https://www.audacityteam.org/'),
        ],
      ),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...categories.map(
            (cat) => Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(cat.icon, color: theme.colorScheme.primary),
                      const SizedBox(width: 10),
                      Text(
                        cat.title,
                        style: AppFonts.sans(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: cat.items
                        .map(
                          (item) => _SoftwareChip(
                            name: item.name,
                            onTap: () => _launchUrl(item.url),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest.withValues(
                alpha: 0.5,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.outline.withValues(alpha: 0.15),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.build_outlined,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Trucs et astuces',
                      style: AppFonts.sans(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Windows Media Player permet de modifier la vitesse de lecture d\'un enregistrement sans modifier la tessiture.',
                  style: AppFonts.sans(
                    fontSize: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: kFloatingNavBarBottomPadding),
        ],
      ),
    );
  }
}

class _SoftwareCategory {
  final String title;
  final IconData icon;
  final List<_SoftwareItem> items;

  _SoftwareCategory({
    required this.title,
    required this.icon,
    required this.items,
  });
}

class _SoftwareItem {
  final String name;
  final String url;

  _SoftwareItem(this.name, this.url);
}

class _SoftwareChip extends StatelessWidget {
  final String name;
  final VoidCallback onTap;

  const _SoftwareChip({required this.name, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.7),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Text(
            name,
            style: AppFonts.sans(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: theme.colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}
