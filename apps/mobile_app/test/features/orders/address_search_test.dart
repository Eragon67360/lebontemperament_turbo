import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/orders/data/address_search.dart';
import 'package:lebontemperament/features/orders/presentation/screens/order_editor_screen.dart';

/// The same cases as packages/domain/src/utils/addressSearch.test.ts.
class _FakeSearch extends AddressSearchService {
  _FakeSearch(this.answer);
  final List<AddressSuggestion> answer;
  final queries = <String>[];

  @override
  Future<List<AddressSuggestion>> search(
    String input, {
    CancelToken? cancelToken,
  }) async {
    queries.add(input);
    return answer;
  }
}

void main() {
  test('query', () {
    expect(addressQuery('  31a  rue des   Vignes '), '31a rue des Vignes');
    expect(addressQuery('ru'), isNull);
    expect(addressQuery('  -- rue'), isNull);
    expect(addressQuery('x' * 201), isNull);
  });

  test('parses a geocoder answer', () {
    final answer = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
            'label': '31a Rue des Vignes 67520 Wangen',
            'context': '67, Bas-Rhin, Grand Est',
          },
        },
        {
          'type': 'Feature',
          'properties': {'label': '31a Rue des Vignes 67520 Wangen'},
        },
        {
          'type': 'Feature',
          'properties': {'label': 'Rue des Vignes 67520 Wangen'},
        },
        {'type': 'Feature', 'properties': <String, Object>{}},
        null,
      ],
    };
    expect(parseAddressSuggestions(answer), const [
      AddressSuggestion(
        label: '31a Rue des Vignes 67520 Wangen',
        context: '67, Bas-Rhin, Grand Est',
      ),
      AddressSuggestion(label: 'Rue des Vignes 67520 Wangen'),
    ]);
    expect(parseAddressSuggestions(null), isEmpty);
    expect(parseAddressSuggestions({'features': 'x'}), isEmpty);
  });

  testWidgets('typing shows suggestions, a tap fills the field', (
    tester,
  ) async {
    final fake = _FakeSearch(const [
      AddressSuggestion(
        label: '31a Rue des Vignes 67520 Wangen',
        context: '67, Bas-Rhin, Grand Est',
      ),
    ]);
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [addressSearchServiceProvider.overrideWithValue(fake)],
        child: MaterialApp(
          home: Scaffold(body: AddressSearchField(controller: controller)),
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), '31a rue des vi');
    await tester.pump(const Duration(milliseconds: 400));
    expect(fake.queries, ['31a rue des vi']);
    expect(find.text('67, Bas-Rhin, Grand Est'), findsOneWidget);

    await tester.tap(find.text('31a Rue des Vignes 67520 Wangen'));
    await tester.pump();
    expect(controller.text, '31a Rue des Vignes 67520 Wangen');
    expect(find.text('67, Bas-Rhin, Grand Est'), findsNothing);
  });

  testWidgets('too short to search: no request', (tester) async {
    final fake = _FakeSearch(const []);
    final controller = TextEditingController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [addressSearchServiceProvider.overrideWithValue(fake)],
        child: MaterialApp(
          home: Scaffold(body: AddressSearchField(controller: controller)),
        ),
      ),
    );
    await tester.enterText(find.byType(TextField), '31');
    await tester.pump(const Duration(milliseconds: 400));
    expect(fake.queries, isEmpty);
  });
}
