import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/member.dart';
import '../../core/config/supabase_config.dart';

class MembersService {
  MembersService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;
  SupabaseClient get _client => SupabaseConfig.client;

  /// Fetches all members through member_directory(): id, name, email, voice
  /// and photo only, sorted by name (#350). Members can't read other
  /// members' rows in profiles directly.
  /// Uses profile_picture_url from profile; for Google auth users,
  /// avatar may also be in auth.users metadata (handled client-side if needed).
  Future<List<Member>> getMembers() async {
    try {
      final response = await _client.rpc('member_directory');

      final list = response as List<dynamic>;
      final members = <Member>[];

      for (final row in list) {
        if (row is! Map<String, dynamic>) continue;
        // Keep everyone with a name, like the website's directory; the
        // screen hides the email line when there is none.
        final email = row['email']?.toString().trim() ?? '';
        final name = row['display_name']?.toString().trim() ?? '';
        if (email.isEmpty && name.isEmpty) continue;

        // Check for Google avatar from current auth user (same user only)
        String? photoUrl = row['profile_picture_url']?.toString();
        if (photoUrl == null || photoUrl.isEmpty) {
          final profileId = row['id']?.toString();
          final authUser = _client.auth.currentUser;
          if (profileId != null &&
              authUser != null &&
              profileId == authUser.id) {
            photoUrl = authUser.userMetadata?['avatar_url']?.toString();
          }
        }

        members.add(
          Member(
            displayName: name.isNotEmpty ? name : email.split('@').first,
            email: email,
            voice: row['voice']?.toString().trim(),
            photoUrl: photoUrl,
          ),
        );
      }

      return members;
    } catch (e) {
      _logger.e('MembersService getMembers error: $e');
      rethrow;
    }
  }
}
