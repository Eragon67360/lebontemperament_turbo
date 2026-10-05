import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Whether the device has a network interface up (Wi-Fi, mobile, ethernet,
/// VPN...). It says nothing about the server being reachable: the lists use
/// it only to word their offline states and to refresh when the network
/// comes back (#361). Unknown counts as online.
final isOnlineProvider = StreamProvider<bool>((ref) async* {
  final connectivity = Connectivity();
  yield _hasNetwork(await connectivity.checkConnectivity());
  yield* connectivity.onConnectivityChanged.map(_hasNetwork);
});

bool _hasNetwork(List<ConnectivityResult> results) {
  if (results.isEmpty) return true;
  return results.any((r) => r != ConnectivityResult.none);
}
