import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/data/constants/anniversary_tracks.dart';

/// Section displaying the Concert Anniversaire (20 ans du BT) album with audio player.
class ConcertAnniversaireSection extends StatefulWidget {
  const ConcertAnniversaireSection({super.key});

  @override
  State<ConcertAnniversaireSection> createState() =>
      _ConcertAnniversaireSectionState();
}

/// Kept alive while scrolled out of the concerts list (a sliver would
/// otherwise dispose it, and the music with it).
class _ConcertAnniversaireSectionState extends State<ConcertAnniversaireSection>
    with AutomaticKeepAliveClientMixin {
  late final AudioPlayer _player;
  StreamSubscription<PlayerState>? _stateSubscription;

  /// The track loaded in the player, playing or paused.
  int? _currentIndex;
  bool _playing = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _stateSubscription = _player.onPlayerStateChanged.listen((state) {
      if (!mounted) return;
      setState(() {
        _playing = state == PlayerState.playing;
        if (state == PlayerState.stopped || state == PlayerState.completed) {
          _currentIndex = null;
        }
      });
    });
  }

  @override
  void dispose() {
    _stateSubscription?.cancel();
    _player.dispose();
    super.dispose();
  }

  /// Plays track [index]; pauses it when it is playing, resumes it when it
  /// is the paused one.
  Future<void> _playTrack(int index) async {
    HapticFeedback.lightImpact();
    try {
      if (_currentIndex == index) {
        if (_playing) {
          await _player.pause();
        } else {
          await _player.resume();
        }
        return;
      }
      final track = kAnniversaryTracks[index];
      setState(() {
        _currentIndex = index;
        _playing = true;
      });
      await _player.play(UrlSource(anniversaryTrackUrl(track.name)));
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _currentIndex = null;
        _playing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Impossible de lire ce morceau. Vérifiez votre connexion.',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(top: 32),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Archives',
            style: AppFonts.sans(
              fontSize: 13,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Concert Anniversaire',
            style: AppFonts.sans(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Enregistrement du concert anniversaire pour les 20 ans du Bon Tempérament',
            style: AppFonts.sans(
              fontSize: 14,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: CachedNetworkImage(
                  imageUrl: kAnniversaryAlbumCoverUrl,
                  width: 100,
                  height: 100,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    width: 100,
                    height: 100,
                    color: theme.colorScheme.surfaceContainerHighest,
                    child: const Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    width: 100,
                    height: 100,
                    color: theme.colorScheme.surfaceContainerHighest,
                    child: Icon(
                      Icons.album_outlined,
                      size: 48,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Les 20 ans du BT (Live)',
                      style: AppFonts.sans(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Le Bon Tempérament',
                      style: AppFonts.sans(
                        fontSize: 14,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 280,
            child: ListView.builder(
              shrinkWrap: true,
              physics: const BouncingScrollPhysics(),
              itemCount: kAnniversaryTracks.length,
              itemBuilder: (context, index) {
                final track = kAnniversaryTracks[index];
                final isCurrent = _currentIndex == index;
                final isPlaying = isCurrent && _playing;

                return InkWell(
                  onTap: () => _playTrack(index),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: isCurrent
                                ? theme.colorScheme.primary.withValues(
                                    alpha: 0.2,
                                  )
                                : theme.colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isPlaying
                                ? Icons.pause_rounded
                                : Icons.play_arrow_rounded,
                            color: theme.colorScheme.primary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                track.displayName,
                                style: AppFonts.sans(
                                  fontSize: 14,
                                  fontWeight: isCurrent
                                      ? FontWeight.w600
                                      : FontWeight.w500,
                                  color: theme.colorScheme.onSurface,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Le Bon Tempérament',
                                style: AppFonts.sans(
                                  fontSize: 12,
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          track.duration,
                          style: AppFonts.sans(
                            fontSize: 12,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
