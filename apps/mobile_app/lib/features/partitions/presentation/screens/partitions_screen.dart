import 'package:audioplayers/audioplayers.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_app/core/config/app_config.dart';
import 'package:mobile_app/core/constants/ui_constants.dart';
import 'package:mobile_app/data/models/drive_file.dart';
import 'package:mobile_app/data/providers/data_providers.dart';
import 'package:mobile_app/data/services/drive_service.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';

class _PartitionTab {
  const _PartitionTab({
    required this.id,
    required this.title,
    required this.folderId,
    required this.icon,
    required this.iconColor,
  });
  final int id;
  final String title;
  final String folderId;
  final IconData icon;
  final Color iconColor;
}

const List<_PartitionTab> _tabs = [
  _PartitionTab(
    id: 1,
    title: 'Adultes',
    folderId: 'adultes',
    icon: Icons.person_outline,
    iconColor: Color(0xFF11BBF8),
  ),
  _PartitionTab(
    id: 2,
    title: 'Jeunes',
    folderId: 'jeunes',
    icon: Icons.person_outline,
    iconColor: Color(0xFFF84E11),
  ),
  _PartitionTab(
    id: 3,
    title: 'Enfants',
    folderId: 'enfants',
    icon: Icons.child_care_outlined,
    iconColor: Color(0xFFC211F8),
  ),
  _PartitionTab(
    id: 4,
    title: 'Orchestre',
    folderId: 'orchestre',
    icon: Icons.music_note_outlined,
    iconColor: Color(0xFF41EDBA),
  ),
  _PartitionTab(
    id: 5,
    title: 'Cahier 30 ans',
    folderId: 'cahier30',
    icon: Icons.menu_book_outlined,
    iconColor: Color(0xFFeb4034),
  ),
];

String _folderIdForTab(_PartitionTab tab) {
  switch (tab.folderId) {
    case 'adultes':
      return AppConfig.driveFolderIdAdultes;
    case 'jeunes':
      return AppConfig.driveFolderIdJeunes;
    case 'enfants':
      return AppConfig.driveFolderIdEnfants;
    case 'orchestre':
      return AppConfig.driveFolderIdOrchestre;
    case 'cahier30':
      return AppConfig.driveFolderIdCahier30Ans;
    default:
      return AppConfig.driveFolderIdAdultes;
  }
}

class PartitionsScreen extends ConsumerStatefulWidget {
  const PartitionsScreen({super.key});

  @override
  ConsumerState<PartitionsScreen> createState() => _PartitionsScreenState();
}

class _PartitionsScreenState extends ConsumerState<PartitionsScreen> {
  _PartitionTab _activeTab = _tabs[0];
  final List<String> _folderStack = [];
  bool _loading = false;
  List<DriveFile> _folders = [];
  List<DriveFile> _files = [];
  String? _error;

  String get _currentFolderId =>
      _folderStack.isNotEmpty ? _folderStack.last : _folderIdForTab(_activeTab);

  Future<void> _loadFolder(String folderId) async {
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

  void _onTabSelected(_PartitionTab tab) {
    HapticFeedback.lightImpact();
    setState(() {
      _activeTab = tab;
      _folderStack.clear();
      _error = null;
    });
    _loadFolder(_folderIdForTab(tab));
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

  String _driveFileProxyUrl(String fileId) =>
      '${AppConfig.siteUrl}/api/drive/file?fileId=${Uri.encodeComponent(fileId)}';

  void _showAudioPlayer(BuildContext context, DriveFile file) {
    if (file.id == null) return;
    final url = _driveFileProxyUrl(file.id!);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DriveAudioPlayerSheet(
        url: url,
        fileName: file.name,
        onClose: () => Navigator.of(ctx).pop(),
      ),
    );
  }

  void _showPdfViewer(BuildContext context, DriveFile file) {
    if (file.id == null) return;
    final url = _driveFileProxyUrl(file.id!);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DrivePdfViewerSheet(
        url: url,
        fileName: file.name,
        onClose: () => Navigator.of(ctx).pop(),
      ),
    );
  }

  Future<void> _onFileDownload(DriveFile file) async {
    if (file.id == null) return;
    HapticFeedback.lightImpact();
    final url = 'https://drive.google.com/uc?id=${file.id}&export=download';
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Impossible de télécharger le fichier.')),
        );
      }
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadFolder(_folderIdForTab(_activeTab));
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isWide = MediaQuery.sizeOf(context).width > 600;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context, theme),
            if (isWide)
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildTabBarVertical(theme),
                    Expanded(child: _buildExplorerContent(theme)),
                  ],
                ),
              )
            else
              Expanded(
                child: Column(
                  children: [
                    _buildTabBarHorizontal(theme),
                    Expanded(child: _buildExplorerContent(theme)),
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

  Widget _buildTabBarVertical(ThemeData theme) {
    return Container(
      width: 72,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
        border: Border(
          right: BorderSide(
            color: theme.colorScheme.outline.withOpacity(0.2),
          ),
        ),
      ),
      child: Column(
        children: _tabs.map((tab) {
          final isActive = _activeTab.id == tab.id;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: IconButton(
              onPressed: () => _onTabSelected(tab),
              icon: Icon(
                tab.icon,
                color: isActive
                    ? tab.iconColor
                    : theme.colorScheme.onSurfaceVariant,
                size: 28,
              ),
              tooltip: tab.title,
              style: IconButton.styleFrom(
                backgroundColor: isActive
                    ? tab.iconColor.withOpacity(0.2)
                    : Colors.transparent,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTabBarHorizontal(ThemeData theme) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: _tabs.map((tab) {
          final isActive = _activeTab.id == tab.id;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              selected: isActive,
              label: Text(tab.title),
              avatar: Icon(
                tab.icon,
                size: 18,
                color: isActive
                    ? tab.iconColor
                    : theme.colorScheme.onSurfaceVariant,
              ),
              onSelected: (_) => _onTabSelected(tab),
              selectedColor: tab.iconColor.withOpacity(0.2),
              checkmarkColor: tab.iconColor,
              showCheckmark: false,
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildExplorerContent(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _activeTab.iconColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _activeTab.icon,
                  color: _activeTab.iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                _activeTab.title,
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
        if (_folderStack.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: InkWell(
              onTap: _onBack,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
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
                      'Retour',
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
        const SizedBox(height: 8),
        Expanded(
          child: _error != null
              ? _buildError(theme)
              : _loading
                  ? _buildLoading(theme)
                  : _buildFileList(theme),
        ),
        _buildDriveLink(theme),
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
      padding:
          const EdgeInsets.fromLTRB(16, 0, 16, kFloatingNavBarBottomPadding),
      children: [
        if (_folders.isNotEmpty) ...[
          _sectionLabel(theme, 'Dossiers'),
          const SizedBox(height: 8),
          ..._folders.map((f) => _FolderTile(
                folder: f,
                onTap: () => _onFolderTap(f),
              )),
          const SizedBox(height: 20),
        ],
        if (_files.isNotEmpty) ...[
          _sectionLabel(theme, 'Fichiers'),
          const SizedBox(height: 8),
          ..._files.map((f) => _FileTile(
                file: f,
                onDownload: () => _onFileDownload(f),
                onPlay:
                    _isAudioFile(f) ? () => _showAudioPlayer(context, f) : null,
                onView: _isPdfFile(f) ? () => _showPdfViewer(context, f) : null,
              )),
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

  Widget _buildDriveLink(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: () async {
          HapticFeedback.lightImpact();
          final uri = Uri.parse(AppConfig.driveFolderMain);
          try {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } catch (_) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Impossible d\'ouvrir le Drive.')),
              );
            }
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.primary.withOpacity(0.85),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.folder_open_rounded,
                color: theme.colorScheme.onPrimary,
                size: 22,
              ),
              const SizedBox(width: 10),
              Text(
                'Accès direct au Drive',
                style: GoogleFonts.poppins(
                  color: theme.colorScheme.onPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
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
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: theme.colorScheme.outline.withOpacity(0.1),
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.folder_rounded,
                color: const Color(0xFF4285F4),
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
                  maxLines: 1,
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
    );
  }
}

class _FileTile extends StatelessWidget {
  final DriveFile file;
  final VoidCallback onDownload;
  final VoidCallback? onPlay;
  final VoidCallback? onView;

  const _FileTile({
    required this.file,
    required this.onDownload,
    this.onPlay,
    this.onView,
  });

  IconData _iconForMimeType(String mimeType) {
    if (mimeType.contains('pdf')) return Icons.picture_as_pdf_rounded;
    if (mimeType.contains('audio') || mimeType.contains('mpeg')) {
      return Icons.audio_file_rounded;
    }
    if (mimeType.contains('musescore')) return Icons.music_note_rounded;
    return Icons.insert_drive_file_rounded;
  }

  Color _colorForMimeType(String mimeType) {
    if (mimeType.contains('pdf')) return const Color(0xFFE53935);
    if (mimeType.contains('audio') || mimeType.contains('mpeg')) {
      return const Color(0xFF1E88E5);
    }
    if (mimeType.contains('musescore')) return const Color(0xFF7B1FA2);
    return const Color(0xFF757575);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final iconColor = _colorForMimeType(file.mimeType);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.1),
          ),
        ),
        child: Row(
          children: [
            Icon(
              _iconForMimeType(file.mimeType),
              color: iconColor,
              size: 26,
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
                tooltip: 'Écouter',
              ),
            if (onView != null)
              IconButton(
                onPressed: onView,
                icon: const Icon(Icons.picture_as_pdf_rounded),
                color: theme.colorScheme.primary,
                tooltip: 'Ouvrir',
              ),
            TextButton(
              onPressed: onDownload,
              child: const Text('Télécharger'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DriveAudioPlayerSheet extends StatefulWidget {
  final String url;
  final String fileName;
  final VoidCallback onClose;

  const _DriveAudioPlayerSheet({
    required this.url,
    required this.fileName,
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
    super.dispose();
  }

  Future<void> _togglePlay() async {
    HapticFeedback.lightImpact();
    if (_playing) {
      await _player.pause();
    } else {
      setState(() {
        _error = null;
        _loading = true;
      });
      try {
        await _player.play(UrlSource(widget.url));
      } catch (e) {
        if (mounted) {
          setState(() {
            _error = 'Impossible de lire l\'audio';
            _loading = false;
          });
        }
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
            color: theme.colorScheme.shadow.withOpacity(0.2),
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
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
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
                icon: _loading
                    ? SizedBox(
                        width: 48,
                        height: 48,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: theme.colorScheme.onPrimary,
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

class _DrivePdfViewerSheet extends StatefulWidget {
  final String url;
  final String fileName;
  final VoidCallback onClose;

  const _DrivePdfViewerSheet({
    required this.url,
    required this.fileName,
    required this.onClose,
  });

  @override
  State<_DrivePdfViewerSheet> createState() => _DrivePdfViewerSheetState();
}

class _DrivePdfViewerSheetState extends State<_DrivePdfViewerSheet> {
  PdfControllerPinch? _controller;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPdf();
  }

  Future<void> _loadPdf() async {
    try {
      final response = await Dio().get(
        widget.url,
        options: Options(responseType: ResponseType.bytes),
      );
      final doc = await PdfDocument.openData(response.data);
      if (!mounted) return;
      setState(() {
        _controller = PdfControllerPinch(
          document: Future.value(doc),
          initialPage: 1,
        );
        _loading = false;
        _error = null;
      });
    } catch (e, st) {
      debugPrint('PDF load error: $e\n$st');
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.fileName,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    widget.onClose();
                  },
                  icon: const Icon(Icons.close_rounded),
                  tooltip: 'Fermer',
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _loading
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Chargement du PDF…',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  )
                : _error != null
                    ? Center(
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
                                'Impossible de charger le PDF',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: theme.colorScheme.error,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      )
                    : PdfViewPinch(
                        controller: _controller!,
                        scrollDirection: Axis.vertical,
                      ),
          ),
        ],
      ),
    );
  }
}
