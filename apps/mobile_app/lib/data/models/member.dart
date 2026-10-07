/// Member from the profiles table (annuaire / membres). Other members see
/// only the name, e-mail, voice and photo: no phone, no address (#350).
class Member {
  const Member({
    required this.displayName,
    required this.email,
    this.voice,
    this.photoUrl,
  });

  final String displayName;
  final String email;
  final String? voice;
  final String? photoUrl;

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      displayName:
          (json['display_name'] ??
                  json['email']?.toString().split('@').first ??
                  '')
              .toString()
              .trim(),
      email: (json['email'] ?? '').toString().trim(),
      voice: json['voice']?.toString().trim(),
      photoUrl:
          json['profile_picture_url']?.toString() ??
          json['photoUrl']?.toString() ??
          json['avatar_url']?.toString(),
    );
  }
}
