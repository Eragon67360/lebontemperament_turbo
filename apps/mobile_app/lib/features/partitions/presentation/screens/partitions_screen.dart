import 'dart:async';
import 'dart:io';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/config/app_config.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/pdf_viewer_sheet.dart';
import 'package:lebontemperament/core/widgets/stage.dart';
import 'package:lebontemperament/data/models/drive_file.dart';
import 'package:lebontemperament/data/models/drive_folder.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';

/// Widest the explorer grows on a tablet: the rows stay readable.
const double _kMaxContentWidth = 720;

/// « 3:40 » (or « 1:02:05 » past an hour).
String _formatDuration(Duration d) {
  final h = d.inHours;
  final m = d.inMinutes.remainder(60);
  final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
  return h > 0 ? '$h:${m.toString().padLeft(2, '0')}:$s' : '$m:$s';
}

class PartitionsScreen extends ConsumerStatefulWidget {
  const PartitionsScreen({super.key});

  @override
  ConsumerState<PartitionsScreen> createState() => _PartitionsScreenState();
}

class _PartitionsScreenState extends ConsumerState<PartitionsScreen> {
  int _activeTabIndex = 0;
  final List<String> _folderStack = [];

  /// Names of the folders in [_folderStack], for the breadcrumb.
  final List<String> _folderNames = [];
  bool _loading = false;
  bool _initialLoadDone = false;
  List<DriveFile> _folders = [];
  List<DriveFile> _files = [];
  String? _error;
  String? _downloadingFileId;

  // Audio: the proxy needs the member's token, which the audio player can't
  // send, so the file is downloaded first (authenticated) and played from a
  // temporary file. The player is created on first use only.
  AudioPlayer? _player;
  final List<StreamSubscription<dynamic>> _audioSubscriptions = [];
  DriveFile? _audioFile;
  PlayerState _audioState = PlayerState.stopped;
  bool _audioLoading = false;
  String? _audioError;
  File? _audioTempFile;
  String? _audioTempFileId;
  Duration _audioPosition = Duration.zero;
  Duration _audioDuration = Duration.zero;

  bool get _audioPlaying => _audioState == PlayerState.playing;

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

  @override
  void dispose() {
    for (final sub in _audioSubscriptions) {
      sub.cancel();
    }
    final player = _player;
    if (player != null) {
      player.stop().ignore();
      player.dispose().ignore();
    }
    _deleteAudioTempFile();
    super.dispose();
  }

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
    } catch (e) {
      // Whatever went wrong, leave the spinner for an error with « Réessayer ».
      if (mounted) {
        setState(() {
          _error = e is DriveServiceException
              ? e.message
              : 'Impossible de charger les fichiers';
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
      _folderNames.clear();
      _error = null;
    });
    _loadFolder(_folderIdForIndex(index));
  }

  void _onFolderTap(DriveFile folder) {
    if (folder.id == null) return;
    HapticFeedback.lightImpact();
    setState(() {
      _folderStack.add(folder.id!);
      _folderNames.add(folder.name);
      _error = null;
    });
    _loadFolder(folder.id!);
  }

  void _onBack() {
    HapticFeedback.lightImpact();
    setState(() {
      _folderStack.removeLast();
      if (_folderNames.isNotEmpty) _folderNames.removeLast();
      _error = null;
    });
    _loadFolder(_currentFolderId);
  }

  bool _isAudioFile(DriveFile file) {
    final m = file.mimeType.toLowerCase();
    final name = file.name.toLowerCase();
    return m.startsWith('audio/') ||
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

  // MARK: - Audio

  AudioPlayer _ensurePlayer() {
    final existing = _player;
    if (existing != null) return existing;
    final player = AudioPlayer();
    _audioSubscriptions.addAll([
      player.onPlayerStateChanged.listen((state) {
        if (!mounted) return;
        setState(() {
          _audioState = state;
          if (state == PlayerState.playing ||
              state == PlayerState.stopped ||
              state == PlayerState.completed) {
            _audioLoading = false;
          }
          if (state == PlayerState.completed) _audioPosition = Duration.zero;
        });
      }),
      player.onPositionChanged.listen((position) {
        if (mounted) setState(() => _audioPosition = position);
      }),
      player.onDurationChanged.listen((duration) {
        if (mounted) setState(() => _audioDuration = duration);
      }),
    ]);
    _player = player;
    return player;
  }

  void _deleteAudioTempFile() {
    _audioTempFile?.parent.delete(recursive: true).ignore();
    _audioTempFile = null;
    _audioTempFileId = null;
  }

  /// The temporary copy of [file], downloaded once per track; null when the
  /// member switched to another track meanwhile.
  Future<File?> _ensureAudioDownloaded(DriveFile file) async {
    final existing = _audioTempFile;
    if (existing != null &&
        _audioTempFileId == file.id &&
        await existing.exists()) {
      return existing;
    }
    final bytes = await ref.read(driveServiceProvider).downloadFile(file.id!);
    final dir = await Directory.systemTemp.createTemp('lbt_audio_');
    final safeName = file.name.replaceAll(RegExp(r'[^\w.\-]'), '_');
    final temp = File('${dir.path}/$safeName');
    await temp.writeAsBytes(bytes, flush: true);
    if (!mounted || _audioFile?.id != file.id) {
      dir.delete(recursive: true).ignore();
      return null;
    }
    _deleteAudioTempFile();
    _audioTempFile = temp;
    _audioTempFileId = file.id;
    return temp;
  }

  /// Plays [file], or pauses / resumes it when it is the current track.
  Future<void> _onAudioToggle(DriveFile file) async {
    if (file.id == null) return;
    HapticFeedback.lightImpact();
    final player = _ensurePlayer();

    if (_audioFile?.id == file.id) {
      if (_audioLoading) return;
      if (_audioPlaying) {
        await player.pause();
        return;
      }
      if (_audioState == PlayerState.paused && _audioTempFile != null) {
        try {
          await player.resume();
          return;
        } catch (_) {
          // Fall through to a fresh start.
        }
      }
    } else {
      setState(() {
        _audioFile = file;
        _audioState = PlayerState.stopped;
        _audioPosition = Duration.zero;
        _audioDuration = Duration.zero;
      });
      try {
        await player.stop();
      } catch (_) {}
      _deleteAudioTempFile();
    }

    if (!mounted) return;
    setState(() {
      _audioError = null;
      _audioLoading = true;
    });
    try {
      final temp = await _ensureAudioDownloaded(file);
      if (temp == null || !mounted || _audioFile?.id != file.id) return;
      await player.play(DeviceFileSource(temp.path));
    } on DriveServiceException catch (e) {
      if (mounted && _audioFile?.id == file.id) {
        setState(() {
          _audioError = e.message;
          _audioLoading = false;
        });
      }
    } catch (_) {
      if (mounted && _audioFile?.id == file.id) {
        setState(() {
          _audioError = 'Impossible de lire l\'audio';
          _audioLoading = false;
        });
      }
    }
  }

  Future<void> _closePlayer() async {
    HapticFeedback.lightImpact();
    setState(() {
      _audioFile = null;
      _audioState = PlayerState.stopped;
      _audioLoading = false;
      _audioError = null;
      _audioPosition = Duration.zero;
      _audioDuration = Duration.zero;
    });
    try {
      await _player?.stop();
    } catch (_) {}
    _deleteAudioTempFile();
  }

  // MARK: - PDF and downloads

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
        load: () => driveService.downloadFile(file.id!),
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

  // MARK: - Layout

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final catalog = ref.watch(driveFolderCatalogProvider);
    _ensureInitialLoad(catalog);

    // System back (gesture or button) goes up one folder before it leaves
    // the screen, like the « Dossier parent » button.
    return PopScope(
      canPop: _folderStack.isEmpty,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBack();
      },
      child: Scaffold(
        backgroundColor: s.surface,
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: _kMaxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildAppBar(context, s),
                  if (catalog.hasError && !catalog.hasValue)
                    Expanded(
                      child: _buildCatalogError(
                        s,
                        onRetry: () =>
                            ref.invalidate(driveFolderCatalogProvider),
                      ),
                    )
                  else if (!catalog.hasValue)
                    Expanded(child: _buildLoading(s))
                  else
                    Expanded(child: _buildExplorer(s, catalog.value!)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, ColorScheme s) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
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
          const SizedBox(width: 4),
          Expanded(
            child: Semantics(
              header: true,
              child: Text(
                'Partitions',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppFonts.display(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  color: s.onSurface,
                ),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Déconnexion',
            color: s.onSurfaceVariant,
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
                      backgroundColor: s.error,
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

  Widget _buildExplorer(ColorScheme s, DriveFolderCatalog catalog) {
    final tabs = catalog.tabs;
    if (tabs.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(child: _buildEmpty(s, 'Aucun dossier disponible')),
          _buildDriveLink(s, catalog),
        ],
      );
    }
    final activeTab = tabs[_activeTabIndex.clamp(0, tabs.length - 1)];
    final audio = _audioFile;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            kScreenHorizontalPadding,
            4,
            kScreenHorizontalPadding,
            0,
          ),
          child: _EnsembleTabs(
            labels: [for (final t in tabs) t.label],
            selectedIndex: _activeTabIndex.clamp(0, tabs.length - 1),
            onSelected: _onTabSelected,
          ),
        ),
        _buildBreadcrumb(s, activeTab),
        Expanded(
          child: Stack(
            children: [
              Positioned.fill(
                child: _error != null
                    ? _buildError(s)
                    : _loading
                    ? _buildLoading(s)
                    : _buildFileList(s, catalog),
              ),
              if (audio != null)
                Positioned(
                  left: 12,
                  right: 12,
                  bottom: 12,
                  child: _NowPlayingCard(
                    fileName: audio.name,
                    playing: _audioPlaying,
                    loading: _audioLoading,
                    error: _audioError,
                    position: _audioPosition,
                    duration: _audioDuration,
                    onToggle: () => _onAudioToggle(audio),
                    onClose: _closePlayer,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  /// « ADULTES › CONCERT » above the current folder's name; the ensemble's
  /// name alone at the top of a tab.
  Widget _buildBreadcrumb(ColorScheme s, DriveFolder activeTab) {
    final inFolder = _folderStack.isNotEmpty;
    final path = [
      activeTab.label,
      if (_folderNames.length > 1)
        ..._folderNames.sublist(0, _folderNames.length - 1),
    ].join(' › ');
    final title = inFolder && _folderNames.isNotEmpty
        ? _folderNames.last
        : activeTab.label;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        inFolder ? 8 : kScreenHorizontalPadding,
        12,
        kScreenHorizontalPadding,
        8,
      ),
      child: Row(
        children: [
          if (inFolder) ...[
            IconButton(
              onPressed: _onBack,
              icon: const Icon(Icons.arrow_upward_rounded),
              tooltip: 'Dossier parent',
              color: s.primary,
            ),
            const SizedBox(width: 4),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (inFolder) ...[
                  Text(
                    path.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppFonts.sans(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.6,
                      color: s.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 2),
                ] else ...[
                  StageEyebrow('Ensemble', color: s.onSurfaceVariant),
                  const SizedBox(height: 2),
                ],
                Semantics(
                  header: true,
                  child: Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppFonts.display(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: s.onSurface,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError(ColorScheme s) {
    return _buildMessage(
      s,
      icon: Icons.error_outline_rounded,
      iconColor: s.error,
      message: _error!,
      onRetry: () => _loadFolder(_currentFolderId),
    );
  }

  Widget _buildLoading(ColorScheme s) {
    return Center(
      child: CircularProgressIndicator(
        color: s.primary,
        semanticsLabel: 'Chargement',
      ),
    );
  }

  /// The catalog service falls back to `.env` rather than failing, so this
  /// is only reached on an unexpected error; still, never spin forever.
  Widget _buildCatalogError(ColorScheme s, {required VoidCallback onRetry}) {
    return _buildMessage(
      s,
      icon: Icons.error_outline_rounded,
      iconColor: s.error,
      message: 'Les dossiers n\'ont pas pu être chargés.',
      onRetry: onRetry,
    );
  }

  Widget _buildMessage(
    ColorScheme s, {
    required IconData icon,
    required Color iconColor,
    required String message,
    VoidCallback? onRetry,
  }) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ExcludeSemantics(child: Icon(icon, size: 48, color: iconColor)),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppFonts.sans(fontSize: 15, color: s.onSurfaceVariant),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onRetry,
                style: FilledButton.styleFrom(minimumSize: const Size(48, 48)),
                icon: const Icon(Icons.refresh_rounded, size: 20),
                label: const Text('Réessayer'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(ColorScheme s, String message) => _buildMessage(
    s,
    icon: Icons.folder_off_outlined,
    iconColor: s.onSurfaceVariant,
    message: message,
  );

  /// Room under the last row: the floating player when it is up (it grows
  /// with the text size), the navigation bar's clearance otherwise.
  double _listBottomPadding(BuildContext context) {
    if (_audioFile == null) return kFloatingNavBarBottomPadding;
    final scale = MediaQuery.textScalerOf(context).scale(16) / 16;
    final player = 150 + 70 * (scale - 1) + (_audioError != null ? 40 : 0);
    return player + 24;
  }

  Widget _buildFileList(ColorScheme s, DriveFolderCatalog catalog) {
    final empty = _folders.isEmpty && _files.isEmpty;
    return ListView(
      padding: EdgeInsets.fromLTRB(
        kScreenHorizontalPadding,
        4,
        kScreenHorizontalPadding,
        _listBottomPadding(context),
      ),
      children: [
        if (empty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: _buildEmpty(s, 'Ce dossier est vide'),
          ),
        for (final folder in _folders)
          _RowGap(
            child: _FolderRow(
              folder: folder,
              onTap: () => _onFolderTap(folder),
            ),
          ),
        for (final file in _files) _RowGap(child: _buildFileRow(file)),
        const SizedBox(height: 12),
        _buildDriveLink(s, catalog),
      ],
    );
  }

  Widget _buildFileRow(DriveFile file) {
    final isAudio = _isAudioFile(file);
    final isPdf = !isAudio && _isPdfFile(file);
    final isCurrent = isAudio && _audioFile?.id == file.id;
    String? status;
    if (isCurrent) {
      status = _audioLoading
          ? 'Chargement…'
          : _audioPlaying
          ? 'En lecture'
          : 'En pause';
      if (_audioDuration > Duration.zero) {
        status += ' · ${_formatDuration(_audioDuration)}';
      }
    }
    return _FileRow(
      file: file,
      kind: isAudio
          ? _FileKind.audio
          : isPdf
          ? _FileKind.pdf
          : _FileKind.other,
      current: isCurrent,
      playing: isCurrent && (_audioPlaying || _audioLoading),
      status: status,
      downloading: _downloadingFileId == file.id,
      onDownload: () => _onFileDownload(file),
      onPlay: isAudio ? () => _onAudioToggle(file) : null,
      onView: isPdf ? () => _showPdfViewer(context, file) : null,
    );
  }

  Widget _buildDriveLink(ColorScheme s, DriveFolderCatalog catalog) {
    final driveUrl = catalog.rootUrl ?? AppConfig.driveFolderMain;
    return Semantics(
      link: true,
      child: StageCard(
        semanticLabel: 'Accès direct au Drive',
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        onTap: () async {
          final uri = Uri.parse(driveUrl);
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
        child: Row(
          children: [
            Icon(Icons.folder_open_rounded, color: s.primary, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Accès direct au Drive',
                style: AppFonts.sans(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: s.onSurface,
                ),
              ),
            ),
            Icon(Icons.open_in_new_rounded, color: s.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

/// The 10 px gap between rows.
class _RowGap extends StatelessWidget {
  const _RowGap({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) =>
      Padding(padding: const EdgeInsets.only(bottom: 10), child: child);
}

/// The ensembles as a segmented pill. Equal segments when every label fits;
/// otherwise (many ensembles, large text) a row that scrolls sideways.
class _EnsembleTabs extends StatelessWidget {
  const _EnsembleTabs({
    required this.labels,
    required this.selectedIndex,
    required this.onSelected,
  });

  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  static const double _inset = 4;
  static const double _labelPadding = 14;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final style = AppFonts.sans(fontSize: 14, fontWeight: FontWeight.w600);
    final scaler = MediaQuery.textScalerOf(context);
    return Semantics(
      container: true,
      label: 'Ensembles',
      child: Container(
        padding: const EdgeInsets.all(_inset),
        decoration: BoxDecoration(
          color: s.surfaceContainer,
          borderRadius: BorderRadius.circular(26),
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final segmentWidth = constraints.maxWidth / labels.length;
            final fits = labels.every((label) {
              final painter = TextPainter(
                text: TextSpan(text: label, style: style),
                textDirection: TextDirection.ltr,
                textScaler: scaler,
                maxLines: 1,
              )..layout();
              final ok = painter.width + 2 * _labelPadding <= segmentWidth;
              painter.dispose();
              return ok;
            });
            final segments = [
              for (var i = 0; i < labels.length; i++)
                _segment(s, style, i, expand: fits),
            ];
            if (fits) return Row(children: segments);
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: segments),
            );
          },
        ),
      ),
    );
  }

  Widget _segment(
    ColorScheme s,
    TextStyle style,
    int i, {
    required bool expand,
  }) {
    final selected = i == selectedIndex;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(22),
    );
    final segment = Semantics(
      button: true,
      selected: selected,
      inMutuallyExclusiveGroup: true,
      child: Material(
        color: selected ? s.surfaceContainerHighest : Colors.transparent,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          customBorder: shape,
          onTap: selected ? null : () => onSelected(i),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: _labelPadding,
                vertical: 8,
              ),
              child: Center(
                widthFactor: 1,
                child: Text(
                  labels[i],
                  maxLines: 1,
                  softWrap: false,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: style.copyWith(
                    color: selected ? s.onSurface : s.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    return expand ? Expanded(child: segment) : segment;
  }
}

enum _FileKind { folder, pdf, audio, other }

/// The rounded-square tile that says what a row is.
class _KindTile extends StatelessWidget {
  const _KindTile({required this.kind, this.musescore = false});
  final _FileKind kind;
  final bool musescore;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final (Color bg, Color fg, IconData icon) = switch (kind) {
      _FileKind.pdf => (s.onSurface, s.surface, Icons.description_outlined),
      _FileKind.audio => (
        s.primaryContainer,
        s.primary,
        Icons.music_note_rounded,
      ),
      _FileKind.folder => (
        s.surfaceContainerHighest,
        s.onSurface,
        Icons.folder_rounded,
      ),
      _FileKind.other => (
        s.surfaceContainerHighest,
        s.onSurfaceVariant,
        musescore
            ? Icons.queue_music_rounded
            : Icons.insert_drive_file_outlined,
      ),
    };
    return ExcludeSemantics(
      child: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: fg, size: 24),
      ),
    );
  }
}

/// Name and meta line of a row.
class _RowText extends StatelessWidget {
  const _RowText({required this.name, required this.meta, this.metaColor});
  final String name;
  final String meta;
  final Color? metaColor;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          name,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: AppFonts.sans(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: s.onSurface,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          meta,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppFonts.sans(
            fontSize: 14,
            color: metaColor ?? s.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _FolderRow extends StatelessWidget {
  const _FolderRow({required this.folder, required this.onTap});
  final DriveFile folder;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return StageCard(
      semanticLabel: 'Dossier ${folder.name}',
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
      child: Row(
        children: [
          const _KindTile(kind: _FileKind.folder),
          const SizedBox(width: 12),
          Expanded(
            child: _RowText(name: folder.name, meta: 'Dossier'),
          ),
          SizedBox(
            width: 48,
            height: 48,
            child: Icon(Icons.chevron_right_rounded, color: s.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _FileRow extends StatelessWidget {
  const _FileRow({
    required this.file,
    required this.kind,
    required this.onDownload,
    this.onPlay,
    this.onView,
    this.current = false,
    this.playing = false,
    this.status,
    this.downloading = false,
  });

  final DriveFile file;
  final _FileKind kind;
  final VoidCallback onDownload;
  final VoidCallback? onPlay;
  final VoidCallback? onView;

  /// The track in the floating player.
  final bool current;

  /// Playing (or about to): the row's button pauses.
  final bool playing;

  /// « En lecture · 3:40 » for the current track.
  final String? status;

  /// True while this file is being fetched for the share sheet.
  final bool downloading;

  String get _meta {
    if (status != null) return status!;
    switch (kind) {
      case _FileKind.pdf:
        return 'Partition · PDF';
      case _FileKind.audio:
        return 'Enregistrement audio';
      case _FileKind.folder:
        return 'Dossier';
      case _FileKind.other:
        if (file.mimeType.contains('musescore')) return 'Fichier MuseScore';
        final dot = file.name.lastIndexOf('.');
        final ext = dot > 0 && dot < file.name.length - 1
            ? file.name.substring(dot + 1).toUpperCase()
            : '';
        return ext.isEmpty || ext.length > 5 ? 'Document' : 'Document · $ext';
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return StageCard(
      selected: current,
      onTap: onPlay ?? onView ?? (downloading ? null : onDownload),
      padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
      child: Row(
        children: [
          _KindTile(kind: kind, musescore: file.mimeType.contains('musescore')),
          const SizedBox(width: 12),
          Expanded(
            child: _RowText(
              name: file.name,
              meta: _meta,
              metaColor: current ? s.primary : null,
            ),
          ),
          if (onPlay != null)
            IconButton(
              onPressed: onPlay,
              icon: Icon(
                playing
                    ? Icons.pause_circle_filled_rounded
                    : Icons.play_circle_filled_rounded,
                size: 32,
              ),
              color: s.primary,
              tooltip: playing
                  ? 'Mettre en pause ${file.name}'
                  : 'Écouter ${file.name}',
            ),
          if (onView != null)
            IconButton(
              onPressed: onView,
              icon: const Icon(Icons.chrome_reader_mode_outlined),
              color: s.primary,
              tooltip: 'Ouvrir ${file.name}',
            ),
          // Icons rather than a « Télécharger » text button, which overflowed
          // the row at 2× text size.
          if (downloading)
            IconButton(
              onPressed: null,
              icon: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: s.primary,
                  semanticsLabel: 'Téléchargement de ${file.name}',
                ),
              ),
              tooltip: 'Téléchargement de ${file.name}',
            )
          else
            IconButton(
              onPressed: onDownload,
              icon: const Icon(Icons.download_rounded),
              color: s.onSurfaceVariant,
              tooltip: 'Télécharger ${file.name}',
            ),
        ],
      ),
    );
  }
}

/// The player pinned above the list while a track is loaded.
class _NowPlayingCard extends StatelessWidget {
  const _NowPlayingCard({
    required this.fileName,
    required this.playing,
    required this.loading,
    required this.error,
    required this.position,
    required this.duration,
    required this.onToggle,
    required this.onClose,
  });

  final String fileName;
  final bool playing;
  final bool loading;
  final String? error;
  final Duration position;
  final Duration duration;
  final VoidCallback onToggle;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final progress = duration > Duration.zero
        ? (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;
    final timeStyle = AppFonts.sans(
      fontSize: 13,
      color: s.onSurfaceVariant,
    ).copyWith(fontFeatures: const [FontFeature.tabularFigures()]);
    final eyebrow = loading
        ? 'Chargement'
        : playing
        ? 'En lecture'
        : 'En pause';

    return Semantics(
      container: true,
      label: 'Lecture en cours',
      child: Material(
        color: s.surfaceContainer,
        elevation: 6,
        shadowColor: s.shadow.withValues(alpha: 0.4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(26),
          side: BorderSide(color: s.outlineVariant),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        StageEyebrow(eyebrow, color: s.primary),
                        const SizedBox(height: 2),
                        Text(
                          fileName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppFonts.display(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: s.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: onClose,
                    icon: const Icon(Icons.close_rounded),
                    color: s.onSurfaceVariant,
                    tooltip: 'Fermer le lecteur',
                  ),
                  const SizedBox(width: 4),
                  IconButton.filled(
                    onPressed: loading ? null : onToggle,
                    iconSize: 30,
                    constraints: const BoxConstraints.tightFor(
                      width: 56,
                      height: 56,
                    ),
                    tooltip: loading
                        ? 'Chargement'
                        : playing
                        ? 'Pause'
                        : 'Lire',
                    style: IconButton.styleFrom(
                      backgroundColor: s.primary,
                      foregroundColor: s.onPrimary,
                      disabledBackgroundColor: s.primary,
                      disabledForegroundColor: s.onPrimary,
                    ),
                    icon: loading
                        ? SizedBox(
                            width: 26,
                            height: 26,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: s.onPrimary,
                              semanticsLabel: 'Chargement',
                            ),
                          )
                        : Icon(
                            playing
                                ? Icons.pause_rounded
                                : Icons.play_arrow_rounded,
                          ),
                  ),
                ],
              ),
              if (error != null) ...[
                const SizedBox(height: 6),
                Text(
                  error!,
                  style: AppFonts.sans(fontSize: 14, color: s.error),
                ),
              ],
              const SizedBox(height: 10),
              Row(
                children: [
                  Text(_formatDuration(position), style: timeStyle),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Semantics(
                      label: duration > Duration.zero
                          ? 'Lecture à ${(progress * 100).round()} %'
                          : 'Progression de la lecture',
                      child: ExcludeSemantics(
                        child: SizedBox(
                          height: 32,
                          child: CustomPaint(
                            painter: _WaveformPainter(
                              progress: progress,
                              played: s.primary,
                              rest: s.outlineVariant,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    duration > Duration.zero
                        ? _formatDuration(duration)
                        : '–:––',
                    style: timeStyle,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A decorative waveform (fixed heights, not the track's real one) filled
/// in the accent colour up to [progress].
class _WaveformPainter extends CustomPainter {
  _WaveformPainter({
    required this.progress,
    required this.played,
    required this.rest,
  });

  final double progress;
  final Color played;
  final Color rest;

  static const _heights = [
    8, 14, 20, 12, 24, 30, 18, 10, 22, 28, 16, 12, 26, 20, 14, 8, 18, 24, 30, //
    22, 12, 16, 26, 20, 10, 14, 22, 28, 18, 12, 8, 16, 24, 20, 14, 10, 18, 12,
    8, 6,
  ];

  @override
  void paint(Canvas canvas, Size size) {
    const gap = 2.0;
    final n = _heights.length;
    final barWidth = (size.width - gap * (n - 1)) / n;
    if (barWidth <= 0) return;
    final playedBars = (progress * n).floor();
    for (var i = 0; i < n; i++) {
      final h = size.height * _heights[i] / 30;
      final left = i * (barWidth + gap);
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(left, (size.height - h) / 2, barWidth, h),
        const Radius.circular(2),
      );
      canvas.drawRRect(rect, Paint()..color = i < playedBars ? played : rest);
    }
  }

  @override
  bool shouldRepaint(_WaveformPainter old) =>
      old.progress != progress || old.played != played || old.rest != rest;
}
