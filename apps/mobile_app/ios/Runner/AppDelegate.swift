import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var accessibilityChannel: FlutterMethodChannel?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    registerAccessibilityChannel()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  /// Tells Dart whether « Réduire la transparence » is on, now and whenever
  /// it changes: the Liquid Glass tab bar (iOS 26+) is replaced by the plain
  /// bar when it is, like Apple's own apps (#549).
  private func registerAccessibilityChannel() {
    guard let registrar = self.registrar(forPlugin: "LbtAccessibility") else { return }
    let channel = FlutterMethodChannel(
      name: "lebontemperament/accessibility",
      binaryMessenger: registrar.messenger()
    )
    channel.setMethodCallHandler { call, result in
      if call.method == "reduceTransparency" {
        result(UIAccessibility.isReduceTransparencyEnabled)
      } else {
        result(FlutterMethodNotImplemented)
      }
    }
    NotificationCenter.default.addObserver(
      forName: UIAccessibility.reduceTransparencyStatusDidChangeNotification,
      object: nil,
      queue: .main
    ) { _ in
      channel.invokeMethod(
        "reduceTransparencyChanged",
        arguments: UIAccessibility.isReduceTransparencyEnabled
      )
    }
    accessibilityChannel = channel
  }
}
