import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pdfx/pdfx.dart';

/// A bottom sheet that displays a PDF from a URL using pdfx.
/// Used by Partitions (Drive files) and Administration (website PDFs).
class PdfViewerSheet extends StatefulWidget {
  final String url;
  final String fileName;
  final VoidCallback onClose;

  /// Optional: when provided, shows an "open in browser" button in the header.
  final Future<void> Function(String url)? onOpenInBrowser;

  /// Optional request headers (e.g. the member's bearer token for the
  /// website's Drive proxy, which refuses anonymous requests).
  final Map<String, String>? headers;

  /// Optional: fetches the PDF bytes instead of a plain GET on [url] (the
  /// Drive proxy goes through `DriveService`, which refreshes an expired
  /// session and words its errors in French).
  final Future<List<int>> Function()? load;

  const PdfViewerSheet({
    super.key,
    required this.url,
    required this.fileName,
    required this.onClose,
    this.onOpenInBrowser,
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
  final _cancelToken = CancelToken();

  @override
  void initState() {
    super.initState();
    _loadPdf();
  }

  Future<void> _loadPdf() async {
    try {
      final List<int> bytes;
      if (widget.load != null) {
        bytes = await widget.load!();
      } else {
        final response =
            await Dio(
              BaseOptions(
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 30),
              ),
            ).get<List<int>>(
              widget.url,
              cancelToken: _cancelToken,
              options: Options(
                responseType: ResponseType.bytes,
                headers: widget.headers,
              ),
            );
        bytes = response.data ?? const [];
      }
      if (!mounted) return;
      final doc = await PdfDocument.openData(Uint8List.fromList(bytes));
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
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                    maxLines: 1,
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
