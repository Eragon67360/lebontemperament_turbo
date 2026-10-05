import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:pdfx/pdfx.dart';

/// Writes a PDF to [savePath]; see [PdfViewerSheet.load].
typedef PdfLoader =
    Future<void> Function(
      String savePath,
      void Function(int received, int total) onProgress,
      CancelToken cancelToken,
    );

/// A bottom sheet that displays a PDF from a URL using pdfx.
/// Used by Partitions (Drive files) and Administration (website PDFs).
class PdfViewerSheet extends StatefulWidget {
  final String url;
  final String fileName;
  final VoidCallback onClose;

  /// Optional: when provided, shows an "open in browser" button in the header.
  final Future<void> Function(String url)? onOpenInBrowser;

  /// Optional: shows a « Télécharger » button in the header (and under an
  /// error) for files the browser could not open anyway, like the
  /// members-only Drive files.
  final VoidCallback? onDownload;

  /// Optional request headers (e.g. the member's bearer token for the
  /// website's Drive proxy, which refuses anonymous requests).
  final Map<String, String>? headers;

  /// Optional: streams the PDF into the given path instead of a plain GET
  /// on [url] (the Drive proxy goes through `DriveService`, which refreshes
  /// an expired session and words its errors in French). The loader reports
  /// its progress and stops when the token is cancelled (the sheet closed).
  final PdfLoader? load;

  const PdfViewerSheet({
    super.key,
    required this.url,
    required this.fileName,
    required this.onClose,
    this.onOpenInBrowser,
    this.onDownload,
    this.headers,
    this.load,
  });

  @override
  State<PdfViewerSheet> createState() => _PdfViewerSheetState();
}

class _PdfViewerSheetState extends State<PdfViewerSheet> {
  PdfControllerPinch? _controller;
  String? _error;
  bool _loading = true;

  /// 0..1 while the size is known, null before the first byte or when the
  /// server did not announce one.
  double? _progress;
  final _cancelToken = CancelToken();
  Directory? _tempDir;

  @override
  void initState() {
    super.initState();
    _loadPdf();
  }

  void _onProgress(int received, int total) {
    if (!mounted || total <= 0) return;
    final progress = (received / total).clamp(0.0, 1.0);
    // Whole percents only: a repaint per chunk would be wasteful.
    if (_progress != null &&
        (progress * 100).floor() == (_progress! * 100).floor()) {
      return;
    }
    setState(() => _progress = progress);
  }

  Future<void> _loadPdf() async {
    try {
      // Streamed to disk rather than held in memory: scores scanned at
      // high resolution run to tens of MB.
      final dir = await Directory.systemTemp.createTemp('lbt_pdf_');
      _tempDir = dir;
      final path = '${dir.path}/document.pdf';
      if (widget.load != null) {
        await widget.load!(path, _onProgress, _cancelToken);
      } else {
        await Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 30),
          ),
        ).download(
          widget.url,
          path,
          cancelToken: _cancelToken,
          onReceiveProgress: _onProgress,
          options: Options(headers: widget.headers),
        );
      }
      if (!mounted) return;
      final doc = await PdfDocument.openFile(path);
      if (!mounted) {
        doc.close().ignore();
        return;
      }
      setState(() {
        _controller = PdfControllerPinch(
          document: Future.value(doc),
          initialPage: 1,
        );
        _loading = false;
        _error = null;
      });
    } catch (e, st) {
      if (_cancelToken.isCancelled) return;
      debugPrint('PDF load error: $e\n$st');
      if (!mounted) return;
      setState(() {
        _error = _messageFor(e);
        _loading = false;
      });
    }
  }

  /// What the member reads when the PDF can't be shown: a service message
  /// when the loader worded one, never Dio's or pdfx's English internals.
  static String _messageFor(Object e) {
    if (e is DioException) {
      return e.response == null
          ? 'Connexion impossible. Vérifiez votre réseau.'
          : 'Le document n\'a pas pu être chargé (erreur ${e.response!.statusCode}).';
    }
    if (e is PlatformException || e is FormatException) {
      return 'Ce fichier n\'est pas un PDF lisible.';
    }
    final text = e.toString();
    return text.isEmpty ? 'Le document n\'a pas pu être chargé.' : text;
  }

  @override
  void dispose() {
    _cancelToken.cancel();
    _controller?.dispose();
    // After the controller: pdfx reads pages from the file lazily.
    _tempDir?.delete(recursive: true).ignore();
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
            color: theme.colorScheme.shadow.withValues(alpha: 0.2),
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
                    style: AppFonts.sans(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (widget.onOpenInBrowser != null)
                  IconButton(
                    onPressed: () async {
                      HapticFeedback.lightImpact();
                      await widget.onOpenInBrowser!(widget.url);
                    },
                    icon: const Icon(Icons.open_in_browser_outlined),
                    tooltip: 'Ouvrir dans le navigateur',
                  ),
                if (widget.onDownload != null)
                  IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      widget.onDownload!();
                    },
                    icon: const Icon(Icons.download_rounded),
                    tooltip: 'Télécharger ou partager',
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
                          value: _progress,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _progress == null
                              ? 'Chargement du PDF…'
                              : 'Chargement du PDF… ${(_progress! * 100).floor()} %',
                          style: AppFonts.sans(
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
                            style: AppFonts.sans(
                              fontSize: 14,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: AppFonts.sans(
                              fontSize: 12,
                              color: theme.colorScheme.error,
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (widget.onOpenInBrowser != null) ...[
                            const SizedBox(height: 16),
                            TextButton.icon(
                              onPressed: () async {
                                HapticFeedback.lightImpact();
                                await widget.onOpenInBrowser!(widget.url);
                                if (context.mounted) widget.onClose();
                              },
                              icon: const Icon(Icons.open_in_browser_outlined),
                              label: const Text('Ouvrir dans le navigateur'),
                            ),
                          ],
                          if (widget.onDownload != null) ...[
                            const SizedBox(height: 16),
                            TextButton.icon(
                              onPressed: () {
                                HapticFeedback.lightImpact();
                                widget.onDownload!();
                              },
                              icon: const Icon(Icons.download_rounded),
                              label: const Text('Télécharger ou partager'),
                            ),
                          ],
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
