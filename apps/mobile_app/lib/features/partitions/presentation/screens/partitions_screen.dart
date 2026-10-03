import 'dart:io';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/config/app_config.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/pdf_viewer_sheet.dart';
import 'package:lebontemperament/data/models/drive_file.dart';
import 'package:lebontemperament/data/models/drive_folder.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';

/// Icon and colour of a tab, keyed by the `drive_folders` slug (the set of
/// folders is fixed in the database; the admin only retargets them).
class _TabStyle {
  const _TabStyle(this.icon, this.color);
  final IconData icon;
  final Color color;
}

_TabStyle _styleForSlug(String slug, ColorScheme scheme) {
  switch (slug) {
    case 'adultes':
      return _TabStyle(Icons.person_outline, scheme.primary);
    case 'jeunes':
      return _TabStyle(Icons.person_outline, scheme.secondary);
    case 'enfants':
      return _TabStyle(Icons.child_care_outlined, scheme.tertiary);
    case 'orchestre':
      // onTertiaryContainer: the container tint itself is near-invisible on
      // the light surface (1.2:1).
      return _TabStyle(Icons.music_note_outlined, scheme.onTertiaryContainer);
    case 'cahier-30-ans':
      return _TabStyle(Icons.menu_book_outlined, scheme.error);
    default:
      return _TabStyle(Icons.folder_outlined, scheme.primary);
  }
}

class PartitionsScreen extends ConsumerStatefulWidget {
  const PartitionsScreen({super.key});

  @override
  ConsumerState<PartitionsScreen> createState() => _PartitionsScreenState();
}

class _PartitionsScreenState extends ConsumerState<PartitionsScreen> {
  int _activeTabIndex = 0;
  final List<String> _folderStack = [];
  bool _loading = false;
  bool _initialLoadDone = false;
  List<DriveFile> _folders = [];
  List<DriveFile> _files = [];
  String? _error;
  String? _downloadingFileId;

  List<DriveFolder> get _tabs =>
      ref.read(driveFolderCatalogProvider).value?.tabs ?? const [];

  String? _folderIdForIndex(int index) {
    final tabs = _tabs;
    if (tabs.isEmpty) return null;
    return tabs[index.clamp(0, tabs.length - 1)].folderId;
  }

  String? get _currentFolderId => _folderStack.isNotEmpty
      ? _folderStack.last
      : _folderIdForIndex(_activeTabIndex);

  Future<void> _loadFolder(String? folderId) async {
    if (folderId == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final driveService = ref.read(driveServiceProvider);
      final items = await driveService.getFolderContents(folderId);

      final folders = items.where((e) => e.isFolder).toList()
        ..sort((a, b) => a.name.compareTo(b.name));
      final files = items.where((e) => !e.isFolder).toList()
        ..sort((a, b) => a.name.compareTo(b.name));

      if (mounted) {
        setState(() {
          _folders = folders;
          _files = files;
          _loading = false;
        });
      }
    } on DriveServiceException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    }
  }

  /// Loads the first tab once the folder catalog is known (it may already be
  /// cached from another screen, or arrive after the first build).
  void _ensureInitialLoad(AsyncValue<DriveFolderCatalog> catalog) {
    if (_initialLoadDone || !catalog.hasValue) return;
    _initialLoadDone = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _loadFolder(_folderIdForIndex(_activeTabIndex));
    });
  }

  void _onTabSelected(int index) {
    HapticFeedback.lightImpact();
    setState(() {
      _activeTabIndex = index;
      _folderStack.clear();
      _error = null;
    });
    _loadFolder(_folderIdForIndex(index));
  }

  void _onFolderTap(DriveFile folder) {
    if (folder.id == null) return;
    HapticFeedback.lightImpact();
    setState(() {
      _folderStack.add(folder.id!);
      _error = null;
    });
    _loadFolder(folder.id!);
  }

  void _onBack() {
    HapticFeedback.lightImpact();
    setState(() {
      _folderStack.removeLast();
      _error = null;
    });
    _loadFolder(_currentFolderId);
  }

  bool _isAudioFile(DriveFile file) {
    final m = file.mimeType.toLowerCase();
    final name = file.name.toLowerCase();
    return m.contains('audio') ||
        m.contains('mpeg') ||
        m.contains('mp3') ||
        name.endsWith('.mp3') ||
        name.endsWith('.wav') ||
        name.endsWith('.m4a') ||
        name.endsWith('.aac');
  }

  bool _isPdfFile(DriveFile file) {
    final m = file.mimeType.toLowerCase();
    final name = file.name.toLowerCase();
    return m.contains('pdf') || name.endsWith('.pdf');
  }

  void _showAudioPlayer(BuildContext context, DriveFile file) {
    if (file.id == null) return;
    final driveService = ref.read(driveServiceProvider);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DriveAudioPlayerSheet(
        fileId: file.id!,
        fileName: file.name,
        download: driveService.downloadFile,
        onClose: () => Navigator.of(ctx).pop(),
      ),
    );
  }

  void _showPdfViewer(BuildContext context, DriveFile file) {
    if (file.id == null) return;
    final driveService = ref.read(driveServiceProvider);
    final url = DriveService.fileProxyUrl(file.id!);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PdfViewerSheet(
        url: url,
        fileName: file.name,
        headers: driveService.authHeaders,
        onClose: () => Navigator.of(ctx).pop(),
        onOpenInBrowser: (u) async {
          // The browser has no app session: open the file on Drive instead
          // of the members-only proxy.
          final uri = Uri.parse(
            'https://drive.google.com/file/d/${file.id}/view',
          );
          try {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } catch (_) {}
        },
      ),
    );
  }

  /// Downloads the file through the website proxy (the member's token; the
  /// files aren't publicly shared on Drive) into a temporary file, then
  /// opens the platform share sheet so the member saves or forwards it.
  Future<void> _onFileDownload(DriveFile file) async {
    final fileId = file.id;
    if (fileId == null || _downloadingFileId != null) return;
    HapticFeedback.lightImpact();
    setState(() => _downloadingFileId = fileId);

    Directory? tempDir;
    try {
      final download = await ref
          .read(driveServiceProvider)
          .downloadAttachment(fileId);
      final name = _safeFileName(download.fileName ?? file.name);
      tempDir = await Directory.systemTemp.createTemp('lbt_download_');
      final tempFile = File('${tempDir.path}/$name');
      await tempFile.writeAsBytes(download.bytes, flush: true);
      if (!mounted) return;

      // iPad presents the sheet as a popover and needs an anchor.
      final box = context.findRenderObject() as RenderBox?;
      final origin = box == null || !box.hasSize
          ? null
          : box.localToGlobal(Offset.zero) & box.size;
      await Share.shareXFiles(
        [XFile(tempFile.path, mimeType: download.contentType, name: name)],
        subject: name,
        sharePositionOrigin: origin,
      );
    } on DriveServiceException catch (e) {
      _showMessage(e.message);
    } catch (_) {
      _showMessage('Impossible de télécharger le fichier.');
    } finally {
      // The share sheet has copied or handed off the file by now.
      tempDir?.delete(recursive: true).ignore();
      if (mounted) setState(() => _downloadingFileId = null);
    }
  }

  /// A file name the device file system accepts; accents are kept.
  static String _safeFileName(String name) {
    final cleaned = name
        .replaceAll(RegExp(r'[/\\:*?"<>|\x00-\x1f]'), '_')
        .trim();
    return cleaned.isEmpty ? 'fichier' : cleaned;
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isWide = MediaQuery.sizeOf(context).width > 600;
    final catalog = ref.watch(driveFolderCatalogProvider);
    _ensureInitialLoad(catalog);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context, theme),
            if (catalog.hasError && !catalog.hasValue)
              Expanded(
                child: _buildCatalogError(
                  theme,
                  onRetry: () => ref.invalidate(driveFolderCatalogProvider),
                ),
              )
            else if (!catalog.hasValue)
              Expanded(child: _buildLoading(theme))
            else if (isWide)
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildTabBarVertical(theme, catalog.value!.tabs),
                    Expanded(
                      child: _buildExplorerContent(theme, catalog.value!),
                    ),
                  ],
                ),
              )
            else
              Expanded(
                child: Column(
                  children: [
                    _buildTabBarHorizontal(theme, catalog.value!.tabs),
                    Expanded(
                      child: _buildExplorerContent(theme, catalog.value!),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            tooltip: 'Retour',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
          ),
          Expanded(
            child: Text(
              'Partitions & Documents',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 18,
                color: theme.colorScheme.onSurface,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Déconnexion',
            onPressed: () async {
              HapticFeedback.lightImpact();
              try {
                await ref.read(authServiceProvider).signOut();
                if (context.mounted) context.go('/login');
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erreur: $e'),
                      backgroundColor: theme.colorScheme.error,
                    ),
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTabBarVertical(ThemeData theme, List<DriveFolder> tabs) {
    return Container(
      width: 72,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        border: Border(
          right: BorderSide(
            color: theme.colorScheme.outline.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Column(
        children: List.generate(tabs.length, (i) {
          final tab = tabs[i];
          final style = _styleForSlug(tab.slug, theme.colorScheme);
          final isActive = _activeTabIndex == i;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: IconButton(
              onPressed: () => _onTabSelected(i),
              isSelected: isActive,
              icon: Icon(
                style.icon,
                color: isActive
                    ? style.color
                    : theme.colorScheme.onSurfaceVariant,
                size: 28,
              ),
              tooltip: tab.label,
              style: IconButton.styleFrom(
                backgroundColor: isActive
                    ? style.color.withValues(alpha: 0.2)
                    : Colors.transparent,
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildTabBarHorizontal(ThemeData theme, List<DriveFolder> tabs) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: List.generate(tabs.length, (i) {
          final tab = tabs[i];
          final style = _styleForSlug(tab.slug, theme.colorScheme);
          final isActive = _activeTabIndex == i;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              selected: isActive,
              label: Text(tab.label),
              avatar: Icon(
                style.icon,
                size: 18,
                color: isActive
                    ? style.color
                    : theme.colorScheme.onSurfaceVariant,
              ),
              onSelected: (_) => _onTabSelected(i),
              selectedColor: style.color.withValues(alpha: 0.2),
              checkmarkColor: style.color,
              showCheckmark: false,
            ),
          );
        }),
      ),
    );
  }

  Widget _buildExplorerContent(ThemeData theme, DriveFolderCatalog catalog) {
    final tabs = catalog.tabs;
    final activeTab = tabs[_activeTabIndex.clamp(0, tabs.length - 1)];
    final style = _styleForSlug(activeTab.slug, theme.colorScheme);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            kScreenHorizontalPadding,
            8,
            kScreenHorizontalPadding,
            0,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: style.color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(style.icon, color: style.color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  activeTab.label,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_folderStack.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              kScreenHorizontalPadding,
              4,
              kScreenHorizontalPadding,
              0,
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: InkWell(
                onTap: _onBack,
                borderRadius: BorderRadius.circular(8),
                child: ConstrainedBox(
                  // 48 dp target (WCAG 2.5.8 / Material).
                  constraints: const BoxConstraints(minHeight: 48),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.arrow_back_rounded,
                          size: 18,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Dossier parent',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        const SizedBox(height: 8),
        Expanded(
          child: _error != null
              ? _buildError(theme)
              : _loading
              ? _buildLoading(theme)
              : _buildFileList(theme),
        ),
        _buildDriveLink(theme, catalog),
      ],
    );
  }

  Widget _buildError(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => _loadFolder(_currentFolderId),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoading(ThemeData theme) {
    return Center(
      child: CircularProgressIndicator(
        color: theme.colorScheme.primary,
        semanticsLabel: 'Chargement',
      ),
    );
  }

  /// The catalog service falls back to `.env` rather than failing, so this
  /// is only reached on an unexpected error; still, never spin forever.
  Widget _buildCatalogError(ThemeData theme, {required VoidCallback onRetry}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Les dossiers n\'ont pas pu être chargés.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFileList(ThemeData theme) {
    if (_folders.isEmpty && _files.isEmpty) {
      return Center(
        child: Text(
          'Ce dossier est vide',
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        kScreenHorizontalPadding,
        0,
        kScreenHorizontalPadding,
        kFloatingNavBarBottomPadding,
      ),
      children: [
        if (_folders.isNotEmpty) ...[
          _sectionLabel(theme, 'Dossiers'),
          const SizedBox(height: 8),
          ..._folders.map(
            (f) => _FolderTile(folder: f, onTap: () => _onFolderTap(f)),
          ),
          const SizedBox(height: 20),
        ],
        if (_files.isNotEmpty) ...[
          _sectionLabel(theme, 'Fichiers'),
          const SizedBox(height: 8),
          ..._files.map(
            (f) => _FileTile(
              file: f,
              downloading: _downloadingFileId == f.id,
              onDownload: () => _onFileDownload(f),
              onPlay: _isAudioFile(f)
                  ? () => _showAudioPlayer(context, f)
                  : null,
              onView: _isPdfFile(f) ? () => _showPdfViewer(context, f) : null,
            ),
          ),
        ],
      ],
    );
  }

  Widget _sectionLabel(ThemeData theme, String label) {
    return Text(
      label,
      style: GoogleFonts.poppins(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: theme.colorScheme.onSurfaceVariant,
      ),
    );
  }

  Widget _buildDriveLink(ThemeData theme, DriveFolderCatalog catalog) {
    final driveUrl = catalog.rootUrl ?? AppConfig.driveFolderMain;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Semantics(
        button: true,
        link: true,
        label: 'Accès direct au Drive',
        child: InkWell(
          onTap: () async {
            HapticFeedback.lightImpact();
            final uri = Uri.parse(driveUrl);
            try {
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            } catch (_) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Impossible d\'ouvrir le Drive.'),
                  ),
                );
              }
            }
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(minHeight: 48),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.primary.withValues(alpha: 0.85),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ExcludeSemantics(
                  child: Icon(
                    Icons.folder_open_rounded,
                    color: theme.colorScheme.onPrimary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    'Accès direct au Drive',
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
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

class _FolderTile extends StatelessWidget {
  final DriveFile folder;
  final VoidCallback onTap;

  const _FolderTile({required this.folder, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Semantics(
        button: true,
        label: 'Dossier ${folder.name}',
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            constraints: const BoxConstraints(minHeight: 48),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainer.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
            child: ExcludeSemantics(
              child: Row(
                children: [
                  Icon(
                    Icons.folder_rounded,
                    color: theme.colorScheme.primary,
                    size: 28,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      folder.name,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: theme.colorScheme.onSurface,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: theme.colorScheme.onSurfaceVariant,
                    size: 24,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FileTile extends StatelessWidget {
  final DriveFile file;
  final VoidCallback onDownload;
  final VoidCallback? onPlay;
  final VoidCallback? onView;

  /// True while this file is being fetched for the share sheet.
  final bool downloading;

  const _FileTile({
    required this.file,
    required this.onDownload,
    this.onPlay,
    this.onView,
    this.downloading = false,
  });

  IconData _iconForMimeType(String mimeType) {
    if (mimeType.contains('pdf')) return Icons.picture_as_pdf_rounded;
    if (mimeType.contains('audio') || mimeType.contains('mpeg')) {
      return Icons.audio_file_rounded;
    }
    if (mimeType.contains('musescore')) return Icons.music_note_rounded;
    return Icons.insert_drive_file_rounded;
  }

  Color _colorForMimeType(String mimeType, ColorScheme scheme) {
    if (mimeType.contains('pdf')) return scheme.error;
    if (mimeType.contains('audio') || mimeType.contains('mpeg')) {
      return scheme.primary;
    }
    if (mimeType.contains('musescore')) return scheme.tertiary;
    return scheme.outline;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final iconColor = _colorForMimeType(file.mimeType, theme.colorScheme);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainer.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
        child: Row(
          children: [
            ExcludeSemantics(
              child: Icon(
                _iconForMimeType(file.mimeType),
                color: iconColor,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                file.name,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: theme.colorScheme.onSurface,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (onPlay != null)
              IconButton(
                onPressed: onPlay,
                icon: const Icon(Icons.play_circle_filled_rounded),
                color: theme.colorScheme.primary,
                tooltip: 'Écouter ${file.name}',
              ),
            if (onView != null)
              IconButton(
                onPressed: onView,
                icon: const Icon(Icons.picture_as_pdf_rounded),
                color: theme.colorScheme.primary,
                tooltip: 'Ouvrir ${file.name}',
              ),
            // An icon like its neighbours: the "Télécharger" text button
            // overflowed the row at 2× text size.
            if (downloading)
              IconButton(
                onPressed: null,
                icon: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: theme.colorScheme.primary,
                    semanticsLabel: 'Téléchargement de ${file.name}',
                  ),
                ),
                tooltip: 'Téléchargement de ${file.name}',
              )
            else
              IconButton(
                onPressed: onDownload,
                icon: const Icon(Icons.download_rounded),
                color: theme.colorScheme.primary,
                tooltip: 'Télécharger ${file.name}',
              ),
          ],
        ),
      ),
    );
  }
}

/// Plays a Drive audio file fetched through the website proxy. The proxy
/// needs the member's token, which the audio player can't send, so the file
/// is downloaded first (authenticated) and played from a temporary file.
class _DriveAudioPlayerSheet extends StatefulWidget {
  final String fileId;
  final String fileName;
  final Future<List<int>> Function(String fileId) download;
  final VoidCallback onClose;

  const _DriveAudioPlayerSheet({
    required this.fileId,
    required this.fileName,
    required this.download,
    required this.onClose,
  });

  @override
  State<_DriveAudioPlayerSheet> createState() => _DriveAudioPlayerSheetState();
}

class _DriveAudioPlayerSheetState extends State<_DriveAudioPlayerSheet> {
  late final AudioPlayer _player;
  bool _playing = false;
  bool _loading = false;
  String? _error;
  File? _tempFile;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _player.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _playing = state == PlayerState.playing;
          if (state == PlayerState.playing || state == PlayerState.stopped) {
            _loading = false;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _player.stop();
    _player.dispose();
    _tempFile?.delete().ignore();
    super.dispose();
  }

  Future<File> _ensureDownloaded() async {
    final existing = _tempFile;
    if (existing != null && await existing.exists()) return existing;
    final bytes = await widget.download(widget.fileId);
    final dir = await Directory.systemTemp.createTemp('lbt_audio_');
    final safeName = widget.fileName.replaceAll(RegExp(r'[^\w.\-]'), '_');
    final file = File('${dir.path}/$safeName');
    await file.writeAsBytes(bytes, flush: true);
    _tempFile = file;
    return file;
  }

  Future<void> _togglePlay() async {
    HapticFeedback.lightImpact();
    if (_playing) {
      await _player.pause();
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final file = await _ensureDownloaded();
      if (!mounted) return;
      await _player.play(DeviceFileSource(file.path));
    } on DriveServiceException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Impossible de lire l\'audio';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).padding.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.4,
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            widget.fileName,
            style: GoogleFonts.poppins(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: theme.colorScheme.onSurface,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(
              _error!,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: theme.colorScheme.error,
              ),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton.filled(
                onPressed: _loading ? null : _togglePlay,
                iconSize: 48,
                tooltip: _loading
                    ? 'Chargement'
                    : _playing
                    ? 'Pause'
                    : 'Lire',
                icon: _loading
                    ? SizedBox(
                        width: 48,
                        height: 48,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: theme.colorScheme.onPrimary,
                          semanticsLabel: 'Chargement',
                        ),
                      )
                    : Icon(
                        _playing
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                        size: 48,
                      ),
                style: IconButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                ),
              ),
              const SizedBox(width: 16),
              IconButton.filled(
                onPressed: () async {
                  HapticFeedback.lightImpact();
                  await _player.stop();
                  widget.onClose();
                },
                icon: const Icon(Icons.close_rounded),
                tooltip: 'Fermer',
                style: IconButton.styleFrom(
                  backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  foregroundColor: theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
