import 'dart:async';
import 'dart:io';

import 'package:audioplayers/audioplayers.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/pdf_viewer_sheet.dart';
import 'package:lebontemperament/core/widgets/stage.dart';
import 'package:lebontemperament/data/models/drive_file.dart';
import 'package:lebontemperament/data/models/drive_folder.dart';
import 'package:lebontemperament/data/providers/connectivity_provider.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:share_plus/share_plus.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../onboarding/presentation/widgets/first_time_tip.dart';

/// Widest the explorer grows on a tablet: the rows stay readable.
const double _kMaxContentWidth = 720;

/// How far the ±10 s buttons and the slider semantics move.
const Duration _kSeekStep = Duration(seconds: 10);

/// « 3:40 » (or « 1:02:05 » past an hour).
String _formatDuration(Duration d) {
  final h = d.inHours;
  final m = d.inMinutes.remainder(60);
  final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
  return h > 0 ? '$h:${m.toString().padLeft(2, '0')}:$s' : '$m:$s';
}

/// « 42 % » for a 0..1 fraction, or null while the size is unknown.
String? _percent(double? fraction) =>
    fraction == null ? null : '${(fraction * 100).floor()} %';

/// Whole percents only: a rebuild per network chunk would be wasteful.
bool _samePercent(double? a, double? b) =>
    a != null && b != null && (a * 100).floor() == (b * 100).floor();

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

  /// The website could not list the whole folder (too many items).
  bool _truncated = false;
  String? _error;
  String? _downloadingFileId;

  /// 0..1 for the row being downloaded, null while the size is unknown.
  double? _downloadProgress;
  CancelToken? _downloadCancelToken;

  // Audio: the proxy needs the member's token, which the audio player can't
  // send, so the file is downloaded first (authenticated) and played from a
  // temporary file. The player is created on first use only.
  AudioPlayer? _player;
  final List<StreamSubscription<dynamic>> _audioSubscriptions = [];
  DriveFile? _audioFile;
  PlayerState _audioState = PlayerState.stopped;
  bool _audioLoading = false;

  /// 0..1 while the track downloads, null while the size is unknown.
  double? _audioProgress;
  CancelToken? _audioCancelToken;
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
    // Leaving the screen stops the transfers, not just the sound.
    _audioCancelToken?.cancel();
    _downloadCancelToken?.cancel();
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

  /// Bumped by every load: an answer for a folder the member has already
  /// left (a quick second tap, a back) is dropped instead of shown.
  int _loadSeq = 0;

  Future<void> _loadFolder(String? folderId) async {
    if (folderId == null) return;
    final seq = ++_loadSeq;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final driveService = ref.read(driveServiceProvider);
      final listing = await driveService.getFolderContents(folderId);
      final items = listing.items;

      final folders = items.where((e) => e.isFolder).toList()
        ..sort(compareDriveNames);
      final files = items.where((e) => !e.isFolder).toList()
        ..sort(compareDriveNames);

      if (mounted && seq == _loadSeq) {
        setState(() {
          _folders = folders;
          _files = files;
          _truncated = listing.truncated;
          _loading = false;
        });
      }
    } catch (e) {
      // Whatever went wrong, leave the spinner for an error with « Réessayer ».
      if (mounted && seq == _loadSeq) {
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
    return m.contains('pdf') ||
        name.endsWith('.pdf') ||
        kPdfExportableMimeTypes.contains(m);
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

  /// The temporary copy of [file], streamed once per track; null when the
  /// member switched to another track (or closed the player) meanwhile.
  Future<File?> _ensureAudioDownloaded(DriveFile file) async {
    final existing = _audioTempFile;
    if (existing != null &&
        _audioTempFileId == file.id &&
        await existing.exists()) {
      return existing;
    }
    final dir = await Directory.systemTemp.createTemp('lbt_audio_');
    final safeName = file.name.replaceAll(RegExp(r'[^\w.\-]'), '_');
    final token = CancelToken();
    _audioCancelToken?.cancel();
    _audioCancelToken = token;
    final File temp;
    try {
      final download = await ref
          .read(driveServiceProvider)
          .downloadToFile(
            file.id!,
            savePath: '${dir.path}/$safeName',
            cancelToken: token,
            onProgress: (received, total) {
              if (!mounted || total <= 0 || _audioFile?.id != file.id) return;
              final progress = (received / total).clamp(0.0, 1.0);
              if (_samePercent(progress, _audioProgress)) return;
              setState(() => _audioProgress = progress);
            },
          );
      temp = download.file;
    } on DriveDownloadCancelled {
      dir.delete(recursive: true).ignore();
      return null;
    } catch (_) {
      dir.delete(recursive: true).ignore();
      rethrow;
    }
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
      _audioCancelToken?.cancel();
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
      _audioProgress = null;
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

  /// Moves the current track to [position] (clamped to the track).
  Future<void> _onSeek(Duration position) async {
    final player = _player;
    if (player == null || _audioLoading || _audioDuration <= Duration.zero) {
      return;
    }
    final target = position < Duration.zero
        ? Duration.zero
        : position > _audioDuration
        ? _audioDuration
        : position;
    setState(() => _audioPosition = target);
    try {
      await player.seek(target);
    } catch (_) {
      // The next position event puts the waveform back where the track is.
    }
  }

  Future<void> _closePlayer() async {
    HapticFeedback.lightImpact();
    _audioCancelToken?.cancel();
    setState(() {
      _audioFile = null;
      _audioState = PlayerState.stopped;
      _audioLoading = false;
      _audioProgress = null;
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
        load: (path, onProgress, cancelToken) => driveService.downloadToFile(
          file.id!,
          savePath: path,
          onProgress: onProgress,
          cancelToken: cancelToken,
        ),
        onClose: () => Navigator.of(ctx).pop(),
        // No « ouvrir dans le navigateur »: the files aren't public on
        // Drive, so the browser would ask for a Google account. Saving or
        // sharing the PDF is what members actually need.
        onDownload: () => _onFileDownload(file),
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
    final token = CancelToken();
    _downloadCancelToken = token;
    setState(() {
      _downloadingFileId = fileId;
      _downloadProgress = null;
    });

    Directory? tempDir;
    try {
      tempDir = await Directory.systemTemp.createTemp('lbt_download_');
      // Streamed under a provisional name; the proxy's name (accents, a
      // Google Doc's « .pdf ») is only known once the headers arrive.
      final download = await ref
          .read(driveServiceProvider)
          .downloadToFile(
            fileId,
            savePath: '${tempDir.path}/${_safeFileName(file.name)}',
            attachment: true,
            cancelToken: token,
            onProgress: (received, total) {
              if (!mounted || total <= 0 || _downloadingFileId != fileId) {
                return;
              }
              final progress = (received / total).clamp(0.0, 1.0);
              if (_samePercent(progress, _downloadProgress)) return;
              setState(() => _downloadProgress = progress);
            },
          );
      final name = _safeFileName(download.fileName ?? file.name);
      var tempFile = download.file;
      if (tempFile.path != '${tempDir.path}/$name') {
        tempFile = await tempFile.rename('${tempDir.path}/$name');
      }
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
    } on DriveDownloadCancelled {
      // The member (or a closing screen) stopped it: nothing to say.
    } on DriveServiceException catch (e) {
      _showMessage(e.message);
    } catch (_) {
      _showMessage('Impossible de télécharger le fichier.');
    } finally {
      // The share sheet has copied or handed off the file by now.
      tempDir?.delete(recursive: true).ignore();
      if (identical(_downloadCancelToken, token)) _downloadCancelToken = null;
      if (mounted && _downloadingFileId == fileId) {
        setState(() {
          _downloadingFileId = null;
          _downloadProgress = null;
        });
      }
    }
  }

  /// Stops the row download in progress (its button while it runs).
  void _cancelDownload() {
    HapticFeedback.lightImpact();
    _downloadCancelToken?.cancel();
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
    // Back online after a failed load: fetch the folder again rather than
    // leaving « Réessayer » to the member.
    ref.listen<AsyncValue<bool>>(isOnlineProvider, (previous, next) {
      if (next.value != true || previous?.value != false) return;
      if (catalog.hasError && !catalog.hasValue) {
        ref.invalidate(driveFolderCatalogProvider);
      } else if (_error != null && !_loading) {
        _loadFolder(_currentFolderId);
      }
    });

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
                  fontSize: 26,
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
                      content: const Text(
                        'La déconnexion a échoué. Réessayez dans un instant.',
                      ),
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
        children: [Expanded(child: _buildEmpty(s, 'Aucun dossier disponible'))],
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
                    : _buildFileList(s),
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
                    progress: _audioProgress,
                    error: _audioError,
                    position: _audioPosition,
                    duration: _audioDuration,
                    onToggle: () => _onAudioToggle(audio),
                    onSeek: _onSeek,
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
                      fontSize: 20,
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
    // A pushed route: no floating nav bar to clear.
    if (_audioFile == null) return 24;
    final scale = MediaQuery.textScalerOf(context).scale(16) / 16;
    // Two title lines and the seek row.
    final player = 180 + 90 * (scale - 1) + (_audioError != null ? 40 : 0);
    return player + 24;
  }

  Widget _buildFileList(ColorScheme s) {
    final empty = _folders.isEmpty && _files.isEmpty;
    return ListView(
      padding: EdgeInsets.fromLTRB(
        kScreenHorizontalPadding,
        4,
        kScreenHorizontalPadding,
        _listBottomPadding(context),
      ),
      children: [
        if (_files.any(_isAudioFile))
          const FirstTimeTip(
            id: 'partitions_listen',
            message:
                'Touchez le bouton lecture d’un enregistrement pour '
                'l’écouter : le lecteur reste en bas de l’écran pendant que '
                'vous parcourez les fichiers.',
            padding: EdgeInsets.only(bottom: 12),
          ),
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
        if (_truncated)
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 6, 4, 0),
            child: Text(
              'Ce dossier contient plus de fichiers que l\'application ne '
              'peut en afficher.',
              style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
            ),
          ),
      ],
    );
  }

  Widget _buildFileRow(DriveFile file) {
    final isAudio = _isAudioFile(file);
    final isPdf = !isAudio && _isPdfFile(file);
    final isCurrent = isAudio && _audioFile?.id == file.id;
    final downloading = _downloadingFileId == file.id;
    String? status;
    if (downloading) {
      final percent = _percent(_downloadProgress);
      status = percent == null
          ? 'Téléchargement…'
          : 'Téléchargement · $percent';
    } else if (isCurrent) {
      final percent = _percent(_audioProgress);
      status = _audioLoading
          ? (percent == null ? 'Chargement…' : 'Chargement · $percent')
          : _audioPlaying
          ? 'En lecture'
          : 'En pause';
      if (!_audioLoading && _audioDuration > Duration.zero) {
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
      downloading: downloading,
      downloadProgress: downloading ? _downloadProgress : null,
      onDownload: () => _onFileDownload(file),
      onCancelDownload: _cancelDownload,
      onPlay: isAudio ? () => _onAudioToggle(file) : null,
      onView: isPdf ? () => _showPdfViewer(context, file) : null,
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
    // « Portée »: the icon alone in a hairline frame, no filled tile.
    final (Color fg, IconData icon) = switch (kind) {
      _FileKind.pdf => (s.onSurface, Icons.description_outlined),
      _FileKind.audio => (s.primary, Icons.music_note_outlined),
      _FileKind.folder => (s.onSurface, Icons.folder_outlined),
      _FileKind.other => (
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
          border: Border.all(color: s.outlineVariant),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: fg, size: 24),
      ),
    );
  }
}

/// The whole name of a row, for the ones three lines can't hold: a long
/// press on the row opens it (the row's tap already does something else).
void _showFullName(BuildContext context, String name) {
  HapticFeedback.mediumImpact();
  showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      content: SelectableText(
        name,
        style: AppFonts.sans(
          fontSize: 16,
          color: Theme.of(ctx).colorScheme.onSurface,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('Fermer'),
        ),
      ],
    ),
  );
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
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
          style: AppFonts.sans(
            fontSize: 15,
            fontWeight: FontWeight.w500,
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
      onLongPress: () => _showFullName(context, folder.name),
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
    this.onCancelDownload,
    this.onPlay,
    this.onView,
    this.current = false,
    this.playing = false,
    this.status,
    this.downloading = false,
    this.downloadProgress,
  });

  final DriveFile file;
  final _FileKind kind;
  final VoidCallback onDownload;

  /// Stops the download in progress (the download button while it runs).
  final VoidCallback? onCancelDownload;
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

  /// 0..1 while [downloading] and the size is known.
  final double? downloadProgress;

  String get _meta {
    if (status != null) return status!;
    switch (kind) {
      case _FileKind.pdf:
        return kPdfExportableMimeTypes.contains(file.mimeType)
            ? 'Document Google · PDF'
            : 'Partition · PDF';
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
      onLongPress: () => _showFullName(context, file.name),
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
          // While it runs, the ring fills with the transfer and the button
          // cancels it (the percentage is in the meta line).
          if (downloading)
            IconButton(
              onPressed: onCancelDownload,
              icon: SizedBox(
                width: 24,
                height: 24,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: downloadProgress,
                      strokeWidth: 2.5,
                      color: s.primary,
                      backgroundColor: s.outlineVariant,
                      semanticsLabel: 'Téléchargement de ${file.name}',
                      semanticsValue: _percent(downloadProgress),
                    ),
                    Icon(Icons.close_rounded, size: 14, color: s.primary),
                  ],
                ),
              ),
              tooltip: 'Annuler le téléchargement de ${file.name}',
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
    required this.progress,
    required this.error,
    required this.position,
    required this.duration,
    required this.onToggle,
    required this.onSeek,
    required this.onClose,
  });

  final String fileName;
  final bool playing;
  final bool loading;

  /// Download progress (0..1) while [loading], when the size is known.
  final double? progress;
  final String? error;
  final Duration position;
  final Duration duration;
  final VoidCallback onToggle;
  final ValueChanged<Duration> onSeek;
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
    final percent = _percent(progress);
    final eyebrow = loading
        ? (percent == null ? 'Chargement' : 'Chargement · $percent')
        : playing
        ? 'En lecture'
        : 'En pause';
    final seekable = !loading && duration > Duration.zero;

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
                          maxLines: 2,
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
                              value: progress,
                              strokeWidth: 2.5,
                              color: s.onPrimary,
                              backgroundColor: s.onPrimary.withValues(
                                alpha: 0.3,
                              ),
                              semanticsLabel: 'Chargement',
                              semanticsValue: percent,
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
              LayoutBuilder(
                builder: (context, constraints) {
                  // The ±10 s buttons only when the waveform keeps room to
                  // be tapped (large text widens the time labels).
                  final timeWidth = _textWidth(
                    context,
                    duration > Duration.zero
                        ? _formatDuration(duration)
                        : '–:––',
                    timeStyle,
                  );
                  final withButtons =
                      constraints.maxWidth - 2 * timeWidth - 2 * 48 - 40 >= 120;
                  return Row(
                    children: [
                      if (withButtons)
                        _SeekButton(
                          icon: Icons.replay_10_rounded,
                          tooltip: 'Reculer de 10 secondes',
                          onPressed: seekable
                              ? () => onSeek(position - _kSeekStep)
                              : null,
                        ),
                      Text(_formatDuration(position), style: timeStyle),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _Waveform(
                          position: position,
                          duration: duration,
                          enabled: seekable,
                          onSeek: onSeek,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        duration > Duration.zero
                            ? _formatDuration(duration)
                            : '–:––',
                        style: timeStyle,
                      ),
                      if (withButtons)
                        _SeekButton(
                          icon: Icons.forward_10_rounded,
                          tooltip: 'Avancer de 10 secondes',
                          onPressed: seekable
                              ? () => onSeek(position + _kSeekStep)
                              : null,
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  static double _textWidth(BuildContext context, String text, TextStyle style) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
      textScaler: MediaQuery.textScalerOf(context),
      maxLines: 1,
    )..layout();
    final width = painter.width;
    painter.dispose();
    return width;
  }
}

/// A 48 dp « ±10 s » button beside the waveform.
class _SeekButton extends StatelessWidget {
  const _SeekButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return IconButton(
      onPressed: onPressed == null
          ? null
          : () {
              HapticFeedback.selectionClick();
              onPressed!();
            },
      icon: Icon(icon),
      color: s.onSurfaceVariant,
      tooltip: tooltip,
      constraints: const BoxConstraints.tightFor(width: 48, height: 48),
      padding: EdgeInsets.zero,
    );
  }
}

/// The waveform as a seek bar: a tap or a drag moves the track there, and
/// to a screen reader it is a slider (« 1:23 sur 4:56 », ±10 s).
class _Waveform extends StatefulWidget {
  const _Waveform({
    required this.position,
    required this.duration,
    required this.enabled,
    required this.onSeek,
  });

  final Duration position;
  final Duration duration;
  final bool enabled;
  final ValueChanged<Duration> onSeek;

  @override
  State<_Waveform> createState() => _WaveformState();
}

class _WaveformState extends State<_Waveform> {
  /// Where the finger is during a drag, as a 0..1 fraction; the player's
  /// own position is shown otherwise.
  double? _dragFraction;

  double get _fraction =>
      _dragFraction ??
      (widget.duration > Duration.zero
          ? (widget.position.inMilliseconds / widget.duration.inMilliseconds)
                .clamp(0.0, 1.0)
          : 0.0);

  Duration _at(double fraction) => Duration(
    milliseconds: (widget.duration.inMilliseconds * fraction.clamp(0.0, 1.0))
        .round(),
  );

  void _seekBy(Duration delta) {
    if (!widget.enabled) return;
    widget.onSeek(widget.position + delta);
  }

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final shown = _at(_fraction);
    return Semantics(
      slider: true,
      enabled: widget.enabled,
      label: 'Position de lecture',
      value: widget.duration > Duration.zero
          ? '${_formatDuration(shown)} sur ${_formatDuration(widget.duration)}'
          : 'Durée inconnue',
      increasedValue: widget.enabled
          ? _formatDuration(
              shown + _kSeekStep > widget.duration
                  ? widget.duration
                  : shown + _kSeekStep,
            )
          : null,
      decreasedValue: widget.enabled
          ? _formatDuration(
              shown - _kSeekStep < Duration.zero
                  ? Duration.zero
                  : shown - _kSeekStep,
            )
          : null,
      onIncrease: widget.enabled ? () => _seekBy(_kSeekStep) : null,
      onDecrease: widget.enabled ? () => _seekBy(-_kSeekStep) : null,
      child: ExcludeSemantics(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            double fractionAt(Offset local) =>
                width <= 0 ? 0 : (local.dx / width).clamp(0.0, 1.0);
            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTapUp: widget.enabled
                  ? (d) {
                      HapticFeedback.selectionClick();
                      widget.onSeek(_at(fractionAt(d.localPosition)));
                    }
                  : null,
              onHorizontalDragStart: widget.enabled
                  ? (d) => setState(
                      () => _dragFraction = fractionAt(d.localPosition),
                    )
                  : null,
              onHorizontalDragUpdate: widget.enabled
                  ? (d) => setState(
                      () => _dragFraction = fractionAt(d.localPosition),
                    )
                  : null,
              onHorizontalDragEnd: widget.enabled
                  ? (_) {
                      final fraction = _dragFraction;
                      setState(() => _dragFraction = null);
                      if (fraction != null) widget.onSeek(_at(fraction));
                    }
                  : null,
              onHorizontalDragCancel: () =>
                  setState(() => _dragFraction = null),
              // 48 dp tall to tap; the bars stay 32 dp in the middle.
              child: SizedBox(
                height: 48,
                child: Center(
                  child: SizedBox(
                    height: 32,
                    width: double.infinity,
                    child: CustomPaint(
                      painter: _WaveformPainter(
                        progress: _fraction,
                        played: widget.enabled ? s.primary : s.outline,
                        rest: s.outlineVariant,
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
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
    // Fewer bars when the row is narrow (large text): each stays ≥ 3 px.
    final n = ((size.width + gap) / (3 + gap)).floor().clamp(
      0,
      _heights.length,
    );
    if (n == 0) return;
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
