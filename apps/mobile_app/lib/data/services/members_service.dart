import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/member.dart';
import '../../core/config/supabase_config.dart';

class MembersService {
  MembersService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;
  SupabaseClient get _client => SupabaseConfig.client;

  /// Fetches all members from the profiles table.
  /// Uses profile_picture_url from profile; for Google auth users,
  /// avatar may also be in auth.users metadata (handled client-side if needed).
  Future<List<Member>> getMembers() async {
    try {
      final response = await _client
          .from('profiles')
          .select(
            'id, email, display_name, address, home_phone, mobile_phone, voice, profile_picture_url',
          )
          .order('display_name', ascending: true, nullsFirst: false);

      final list = response as List<dynamic>;
      final members = <Member>[];

      for (final row in list) {
        if (row is! Map<String, dynamic>) continue;
        final email = row['email']?.toString().trim();
        if (email == null || email.isEmpty) continue;

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

        members.add(Member(
          displayName:
              (row['display_name'] ?? email.split('@').first).toString().trim(),
          email: email,
          address: row['address']?.toString().trim(),
          homePhone: row['home_phone']?.toString().trim(),
          mobilePhone: row['mobile_phone']?.toString().trim(),
          voice: row['voice']?.toString().trim(),
          photoUrl: photoUrl,
        ));
      }

      return members;
    } catch (e) {
      _logger.e('MembersService getMembers error: $e');
      rethrow;
    }
  }
}
