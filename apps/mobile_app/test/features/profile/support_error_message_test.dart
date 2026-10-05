import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/profile/presentation/screens/support_contact_screen.dart';

/// The support form used to show Dio's English (« The connection errored… »)
/// to members. The API's own French message is kept; the rest is ours.
void main() {
  final options = RequestOptions(path: '/api/contact/mobile');

  test('keeps the API\'s French message', () {
    final e = DioException(
      requestOptions: options,
      type: DioExceptionType.badResponse,
      response: Response(
        requestOptions: options,
        statusCode: 400,
        data: {
          'success': false,
          'message': 'Le sujet et le message sont requis',
        },
      ),
    );
    expect(supportErrorMessage(e), 'Le sujet et le message sont requis');
  });

  test('a connection error reads as « pas de connexion »', () {
    final e = DioException(
      requestOptions: options,
      type: DioExceptionType.connectionError,
      message: 'The connection errored: Failed host lookup',
    );
    expect(supportErrorMessage(e), contains('Pas de connexion'));

    final unknown = DioException(
      requestOptions: options,
      type: DioExceptionType.unknown,
      error: const SocketException('no route'),
    );
    expect(supportErrorMessage(unknown), contains('Pas de connexion'));
  });

  test('a timeout and an expired session have their own sentences', () {
    expect(
      supportErrorMessage(
        DioException(
          requestOptions: options,
          type: DioExceptionType.receiveTimeout,
        ),
      ),
      contains('trop de temps'),
    );
    expect(
      supportErrorMessage(
        DioException(
          requestOptions: options,
          type: DioExceptionType.badResponse,
          response: Response(requestOptions: options, statusCode: 401),
        ),
      ),
      contains('Session expirée'),
    );
  });

  test('never shows English or a raw exception', () {
    for (final e in [
      StateError('boom'),
      DioException(
        requestOptions: options,
        type: DioExceptionType.unknown,
        message: 'Something went wrong',
      ),
    ]) {
      final text = supportErrorMessage(e);
      expect(text, isNot(contains('boom')));
      expect(text, isNot(contains('went wrong')));
      expect(text, contains('Réessayez'));
    }
  });
}
