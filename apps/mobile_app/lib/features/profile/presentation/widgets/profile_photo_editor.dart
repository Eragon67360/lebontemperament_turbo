import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';

import '../../../../data/providers/data_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/profile_photo_service.dart';

/// Picks a photo from [source]; null when the member cancels.
typedef PickProfilePhoto = Future<Uint8List?> Function(ImageSource source);

Future<Uint8List?> _pickPhoto(ImageSource source) async {
  // Resized and recompressed on the phone: a profile photo shows at most a
  // few hundred pixels wide, the upload stays small, and iPhone photos
  // (HEIC) come back as JPEG.
  final file = await ImagePicker().pickImage(
    source: source,
    maxWidth: 1024,
    maxHeight: 1024,
    imageQuality: 85,
    preferredCameraDevice: CameraDevice.front,
    requestFullMetadata: false,
  );
  return file?.readAsBytes();
}

/// The photo picker; tests replace it.
final pickProfilePhotoProvider = Provider<PickProfilePhoto>(
  (ref) => _pickPhoto,
);

/// True while a new photo is being sent or the old one removed.
final profilePhotoBusyProvider = StateProvider<bool>((ref) => false);

enum _PhotoAction { camera, gallery, remove }

/// Profil › photo: « Prendre une photo », « Choisir dans la galerie », and
/// « Retirer la photo » when there is one. Only the photo changes; the name
/// stays the association's.
Future<void> editProfilePhoto(BuildContext context) async {
  // The container outlives the widget: the upload finishes even if the
  // member leaves the profile meanwhile.
  final ref = ProviderScope.containerOf(context, listen: false);
  if (ref.read(profilePhotoBusyProvider)) return;
  final hasPhoto = (ref.read(profilePictureUrlProvider) ?? '').isNotEmpty;
  final s = Theme.of(context).colorScheme;

  final action = await showModalBottomSheet<_PhotoAction>(
    context: context,
    useSafeArea: true,
    showDragHandle: true,
    backgroundColor: s.surfaceContainerLow,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
            child: Text(
              'Photo de profil',
              style: AppFonts.sans(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: s.onSurface,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
            child: Text(
              'Les autres membres la voient dans la liste des membres.',
              style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
            ),
          ),
          ListTile(
            leading: Icon(Icons.photo_camera_outlined, color: s.primary),
            title: const Text('Prendre une photo'),
            onTap: () => Navigator.of(ctx).pop(_PhotoAction.camera),
          ),
          ListTile(
            leading: Icon(Icons.photo_library_outlined, color: s.primary),
            title: const Text('Choisir dans la galerie'),
            onTap: () => Navigator.of(ctx).pop(_PhotoAction.gallery),
          ),
          if (hasPhoto)
            ListTile(
              leading: Icon(Icons.delete_outline_rounded, color: s.error),
              title: Text('Retirer la photo', style: TextStyle(color: s.error)),
              onTap: () => Navigator.of(ctx).pop(_PhotoAction.remove),
            ),
          const SizedBox(height: 8),
        ],
      ),
    ),
  );
  if (action == null || !context.mounted) return;

  final messenger = ScaffoldMessenger.of(context);
  void say(String message, {bool error = false}) {
    messenger.showSnackBar(
      SnackBar(content: Text(message), backgroundColor: error ? s.error : null),
    );
  }

  Uint8List? bytes;
  if (action != _PhotoAction.remove) {
    final source = action == _PhotoAction.camera
        ? ImageSource.camera
        : ImageSource.gallery;
    try {
      bytes = await ref.read(pickProfilePhotoProvider)(source);
    } on PlatformException catch (e) {
      say(switch (e.code) {
        'camera_access_denied' =>
          'L’accès à l’appareil photo est refusé. Autorisez-le dans les '
              'réglages du téléphone.',
        'photo_access_denied' =>
          'L’accès aux photos est refusé. Autorisez-le dans les réglages du '
              'téléphone.',
        _ => 'Impossible d’ouvrir les photos.',
      }, error: true);
      return;
    }
    if (bytes == null) return;
  }

  final busy = ref.read(profilePhotoBusyProvider.notifier);
  busy.state = true;
  try {
    final service = ref.read(profilePhotoServiceProvider);
    if (bytes != null) {
      await service.upload(bytes);
    } else {
      await service.remove();
    }
    // The header, the home screen and the members list read the new URL.
    ref.invalidate(userProfileProvider);
    ref.invalidate(membersProvider);
    say(bytes != null ? 'Photo de profil mise à jour.' : 'Photo retirée.');
  } on ProfilePhotoException catch (e) {
    say(e.message, error: true);
  } catch (_) {
    say(
      'La photo n’a pas pu être enregistrée. Réessayez plus tard.',
      error: true,
    );
  } finally {
    busy.state = false;
  }
}

/// The member's photo (or initials) with a camera badge; a tap opens
/// [editProfilePhoto].
class ProfilePhotoButton extends ConsumerWidget {
  const ProfilePhotoButton({super.key, required this.initials});

  final String initials;
  static const double size = 80;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = Theme.of(context).colorScheme;
    final photoUrl = ref.watch(profilePictureUrlProvider);
    final busy = ref.watch(profilePhotoBusyProvider);

    Widget initialsAvatar() => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: s.primary, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: AppFonts.sans(
          color: s.onPrimary,
          fontSize: 24,
          fontWeight: FontWeight.w600,
        ),
      ),
    );

    return Semantics(
      // Its own node: the app bar would merge it into the name.
      container: true,
      button: true,
      label: 'Changer la photo de profil',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: busy
            ? null
            : () {
                HapticFeedback.lightImpact();
                editProfilePhoto(context);
              },
        child: SizedBox(
          width: size + 6,
          height: size + 6,
          child: Stack(
            children: [
              ClipOval(
                child: photoUrl != null && photoUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: photoUrl,
                        width: size,
                        height: size,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => initialsAvatar(),
                        errorWidget: (_, _, _) => initialsAvatar(),
                      )
                    : initialsAvatar(),
              ),
              if (busy)
                Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.45),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: const SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  ),
                ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: s.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: s.surface, width: 2),
                  ),
                  child: Icon(
                    Icons.photo_camera_outlined,
                    size: 16,
                    color: s.onPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
