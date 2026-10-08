import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:logger/logger.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../../data/services/bug_reports_service.dart';
import '../../providers/bug_reports_providers.dart';
import '../widgets/report_widgets.dart';
import 'report_conversation_screen.dart';

/// Picks one image from the phone's photos; null when the member cancels.
typedef PickScreenshot = Future<Uint8List?> Function();

Future<Uint8List?> _pickFromGallery() async {
  // Resized and recompressed on the phone: screenshots stay readable, and
  // iPhone photos (HEIC) come back as JPEG.
  final file = await ImagePicker().pickImage(
    source: ImageSource.gallery,
    maxWidth: 1600,
    maxHeight: 1600,
    imageQuality: 80,
    requestFullMetadata: false,
  );
  return file?.readAsBytes();
}

/// « 2.0.138 (155) · iOS 18.1 », for the superadmin reading the report.
Future<String> _appInfo() async {
  var version = '';
  try {
    final info = await PackageInfo.fromPlatform();
    version = '${info.version} (${info.buildNumber})';
  } catch (_) {}
  final system = Platform.isIOS
      ? 'iOS'
      : Platform.isAndroid
      ? 'Android'
      : Platform.operatingSystem;
  final text = [
    if (version.isNotEmpty) version,
    '$system ${Platform.operatingSystemVersion}',
  ].join(' · ');
  return text.length > 200 ? text.substring(0, 200) : text;
}

/// Profil › Signaler un problème: a title, what happened, and up to three
/// screenshots. Once sent, the member lands on the report's conversation,
/// where the answer will come.
class ReportProblemScreen extends ConsumerStatefulWidget {
  const ReportProblemScreen({super.key, this.pickScreenshot, this.appInfo});

  /// Replaces the photo picker in tests.
  final PickScreenshot? pickScreenshot;

  /// Replaces the app version and system in tests.
  final Future<String> Function()? appInfo;

  @override
  ConsumerState<ReportProblemScreen> createState() =>
      _ReportProblemScreenState();
}

class _Shot {
  _Shot(this.bytes, this.contentType);
  final Uint8List bytes;
  final String contentType;
}

class _ReportProblemScreenState extends ConsumerState<ReportProblemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _shots = <_Shot>[];
  bool _sending = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  void _say(String text) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(text)));
  }

  Future<void> _addScreenshot() async {
    if (_shots.length >= kMaxBugScreenshots) return;
    Uint8List? bytes;
    try {
      bytes = await (widget.pickScreenshot ?? _pickFromGallery)();
    } catch (e) {
      Logger().w('Screenshot picker failed: $e');
      if (mounted) {
        _say('Impossible d’ouvrir vos photos. Vérifiez l’accès aux photos.');
      }
      return;
    }
    if (bytes == null || !mounted) return;
    final type = bugScreenshotContentType(bytes);
    if (type == null) {
      _say('Ce format d’image n’est pas pris en charge (JPEG ou PNG).');
      return;
    }
    if (bytes.length > kMaxBugScreenshotBytes) {
      _say('Cette image est trop lourde (5 Mo au plus).');
      return;
    }
    setState(() => _shots.add(_Shot(bytes!, type)));
  }

  Future<void> _send() async {
    if (_sending) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _sending = true);
    final service = ref.read(bugReportsServiceProvider);
    final uploaded = <String>[];
    try {
      for (final shot in _shots) {
        uploaded.add(
          await service.uploadScreenshot(shot.bytes, shot.contentType),
        );
      }
      final id = await service.createReport(
        title: _title.text.trim(),
        description: _description.text.trim(),
        screenshotPaths: uploaded,
        appInfo: await (widget.appInfo ?? _appInfo)(),
      );
      ref.invalidate(myBugReportsProvider);
      if (!mounted) return;
      HapticFeedback.lightImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Merci ! Votre signalement est envoyé.')),
      );
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ReportConversationScreen(reportId: id),
        ),
      );
    } catch (e) {
      Logger().w('Bug report not sent: $e');
      // Don't leave files behind for a report that doesn't exist.
      try {
        await service.removeScreenshots(uploaded);
      } catch (_) {}
      if (!mounted) return;
      setState(() => _sending = false);
      _say(
        'Le signalement n’a pas pu être envoyé. Vérifiez votre connexion et '
        'réessayez.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final label = AppFonts.sans(
      fontSize: 15,
      fontWeight: FontWeight.w600,
      color: s.onSurface,
    );
    InputDecoration field(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: AppFonts.sans(color: s.onSurfaceVariant),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.all(16),
    );

    return ReportsPage(
      title: 'Signaler un problème',
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
          sliver: SliverToBoxAdapter(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Quelque chose ne marche pas, ou vous semble bizarre ? '
                    'Racontez-nous : on vous répond ici, et vous recevez une '
                    'notification.',
                    style: AppFonts.sans(
                      fontSize: 16,
                      height: 1.5,
                      color: s.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('En quelques mots', style: label),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _title,
                    enabled: !_sending,
                    textCapitalization: TextCapitalization.sentences,
                    textInputAction: TextInputAction.next,
                    style: AppFonts.sans(),
                    decoration: field('Ex. : le lecteur s’arrête tout seul'),
                    inputFormatters: [LengthLimitingTextInputFormatter(120)],
                    validator: (v) => (v == null || v.trim().length < 3)
                        ? 'Donnez un titre au problème.'
                        : null,
                  ),
                  const SizedBox(height: 20),
                  Text('Ce qui s’est passé', style: label),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _description,
                    enabled: !_sending,
                    minLines: 5,
                    maxLines: 10,
                    textCapitalization: TextCapitalization.sentences,
                    style: AppFonts.sans(),
                    decoration: field(
                      'Sur quel écran, ce que vous avez fait, ce que vous '
                      'attendiez…',
                    ),
                    inputFormatters: [LengthLimitingTextInputFormatter(4000)],
                    validator: (v) => (v == null || v.trim().length < 10)
                        ? 'Décrivez le problème en une phrase au moins.'
                        : null,
                  ),
                  const SizedBox(height: 24),
                  Text('Captures d’écran (facultatif)', style: label),
                  const SizedBox(height: 4),
                  Text(
                    'Jusqu’à $kMaxBugScreenshots images, choisies dans vos '
                    'photos.',
                    style: AppFonts.sans(
                      fontSize: 14,
                      color: s.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      for (final (i, shot) in _shots.indexed)
                        _Thumbnail(
                          bytes: shot.bytes,
                          index: i,
                          onRemove: _sending
                              ? null
                              : () => setState(() => _shots.removeAt(i)),
                        ),
                      if (_shots.length < kMaxBugScreenshots)
                        OutlinedButton.icon(
                          onPressed: _sending ? null : _addScreenshot,
                          icon: const Icon(Icons.add_photo_alternate_outlined),
                          label: const Text('Ajouter une capture'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  FilledButton(
                    onPressed: _sending ? null : _send,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _sending
                        ? Semantics(
                            label: 'Envoi en cours',
                            child: SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: s.onPrimary,
                              ),
                            ),
                          )
                        : Text(
                            'Envoyer',
                            style: AppFonts.sans(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({
    required this.bytes,
    required this.index,
    required this.onRemove,
  });

  final Uint8List bytes;
  final int index;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: s.outlineVariant),
            borderRadius: BorderRadius.circular(12),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.memory(
              bytes,
              width: 88,
              height: 120,
              fit: BoxFit.cover,
              semanticLabel: 'Capture ${index + 1}',
            ),
          ),
        ),
        Positioned(
          top: -12,
          right: -12,
          child: IconButton.filledTonal(
            iconSize: 18,
            onPressed: onRemove,
            tooltip: 'Retirer la capture ${index + 1}',
            icon: const Icon(Icons.close_rounded),
          ),
        ),
      ],
    );
  }
}
