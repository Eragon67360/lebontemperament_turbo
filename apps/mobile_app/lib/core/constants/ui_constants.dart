// This file holds constant values related to the UI.

// --- Screen Layout ---

/// Horizontal padding for screen content (unified UI).
const double kScreenHorizontalPadding = 20.0;

/// Top padding for home-like screens (no AppBar).
const double kScreenTopPadding = 60.0;

/// Spacing between major sections.
const double kSectionSpacing = 32.0;

/// Spacing between section header and content.
const double kSectionHeaderSpacing = 16.0;

/// Border radius for list cards.
const double kCardBorderRadius = 16.0;

/// Border radius for bento/banner cards.
const double kCardBorderRadiusLarge = 24.0;

// --- Navigation Bar ---

// The height of our custom navigation bar in main_screen.dart is 70.
const double kNavBarHeight = 80.0;

// The bottom margin of the nav bar is 20.
const double kNavBarBottomMargin = 20.0;

// An extra bit of padding so the last item isn't flush against the nav bar.
const double kExtraScrollPadding = 20.0;

// THE CONSTANT TO USE ON ALL SCREENS:
// This is the total space needed at the bottom of a scrollable list
// to ensure its content is not hidden by the floating navigation bar.
const double kFloatingNavBarBottomPadding =
    kNavBarHeight + kNavBarBottomMargin + kExtraScrollPadding; // Result: 110.0

// --- External URLs and contact (replace with real values) ---
const String kPrivacyPolicyUrl =
    'https://www.lebontemperament.com/politique-de-confidentialite';

const String kSupportEmail = 'contactlebontemperament@gmail.com';

/// WhatsApp number with country code, no + or spaces (e.g. 33123456789).
const String kSupportWhatsAppPhone = '33647849308';

/// Website base URL for PDFs and static assets.
const String kWebsiteBaseUrl = 'https://www.lebontemperament.com';

/// Drive folder URLs for administration archives.
const String kDriveCaUrl =
    'https://drive.google.com/drive/folders/0B3HMykcVQJAVdmw2aTdyQUJyWUE?resourcekey=0-eSCStZ_H5-WvEpmFYk8sdQ';
const String kDriveAgUrl =
    'https://drive.google.com/drive/folders/0B3HMykcVQJAVUGE3SllOZlRDMFk?resourcekey=0-KWWoenv1O_uTnu0GNE1t2Q';
const String kDrivePmUrl =
    'https://drive.google.com/drive/folders/0B3HMykcVQJAVcG9Nd1JRa19tM3c?resourcekey=0-kSko9ElajKHa981AXkCz8Q';

/// Google Calendar embed URL for rehearsals (lebontemperament@gmail.com).
const String kGoogleCalendarUrl =
    'https://calendar.google.com/calendar/embed?src=lebontemperament%40gmail.com';
