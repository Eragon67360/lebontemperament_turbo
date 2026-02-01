// This file holds constant values related to the UI.

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
