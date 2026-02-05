/// Member from the profiles table (annuaire / membres).
class Member {
  const Member({
    required this.displayName,
    required this.email,
    this.address,
    this.homePhone,
    this.mobilePhone,
    this.voice,
    this.photoUrl,
  });

  final String displayName;
  final String email;
  final String? address;
  final String? homePhone;
  final String? mobilePhone;
  final String? voice;
  final String? photoUrl;

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      displayName: (json['display_name'] ??
              json['email']?.toString().split('@').first ??
              '')
          .toString()
          .trim(),
      email: (json['email'] ?? '').toString().trim(),
      address: json['address']?.toString().trim(),
      homePhone: json['home_phone']?.toString().trim(),
      mobilePhone: json['mobile_phone']?.toString().trim(),
      voice: json['voice']?.toString().trim(),
      photoUrl: json['profile_picture_url']?.toString() ??
          json['photoUrl']?.toString() ??
          json['avatar_url']?.toString(),
    );
  }
}
