import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/ui_constants.dart';
import '../../../../core/theme/app_fonts.dart';
import '../../../../core/widgets/stage.dart';
import '../../data/public_content.dart';
import '../providers/rehearsal_slots_provider.dart';
import '../widgets/public_widgets.dart';

/// « Nous rejoindre »: the joining facts of the website's /rejoindre page
/// (#334), and two ways to write to us. The rehearsal times are the ones
/// admins publish (#620), the built-in ones until they arrive.
class JoinScreen extends ConsumerWidget {
  const JoinScreen({super.key});

  static final Uri _mailto = Uri(
    scheme: 'mailto',
    path: kSupportEmail,
    query: 'subject=${Uri.encodeComponent('Rejoindre Le Bon Tempérament')}',
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final slots = ref.watch(rehearsalSlotsProvider).value ?? kRehearsalSlots;
    final bodyStyle = AppFonts.sans(
      fontSize: 15,
      height: 1.45,
      color: scheme.onSurface,
    );

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverSafeArea(
            bottom: false,
            sliver: SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                kScreenHorizontalPadding,
                16,
                kScreenHorizontalPadding,
                kFloatingNavBarBottomPadding,
              ),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const PublicPageTitle(
                    title: 'Nous rejoindre',
                    subtitle:
                        'Chanteurs et instrumentistes de tous niveaux, '
                        'bienvenue !',
                  ),
                  const SizedBox(height: 20),
                  for (final fact in kJoiningFacts) _FactRow(fact: fact),
                  const SizedBox(height: 20),
                  const StageSectionHeader(title: 'Les répétitions'),
                  const SizedBox(height: 4),
                  Text(
                    'En général, pour le chœur d’adultes et l’orchestre. Les '
                    'chœurs d’enfants et de jeunes ont leurs propres horaires : '
                    'demandez-les-nous.',
                    style: AppFonts.sans(
                      fontSize: 14,
                      height: 1.4,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  for (final slot in slots)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _SlotCard(slot: slot),
                    ),
                  const SizedBox(height: 20),
                  const StageSectionHeader(title: 'Comment faire'),
                  const SizedBox(height: 8),
                  _Step(
                    number: 1,
                    text:
                        'Écrivez-nous en disant ce que vous chantez ou jouez '
                        '(ou aimeriez chanter). Nous vous proposons une date.',
                    style: bodyStyle,
                  ),
                  _Step(
                    number: 2,
                    text:
                        'Venez à une répétition d’essai : vous rencontrez le '
                        'chef, les membres et le répertoire.',
                    style: bodyStyle,
                  ),
                  _Step(
                    number: 3,
                    text:
                        'Vous décidez de rester ? Vous adhérez à '
                        'l’association, et c’est parti pour les répétitions, '
                        'les concerts et la tournée d’été.',
                    style: bodyStyle,
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: () => openExternal(context, _mailto.toString()),
                    icon: const Icon(Icons.mail_outline_rounded),
                    label: const Text('Nous écrire'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () => openExternal(context, kContactFormUrl),
                    icon: const Icon(Icons.open_in_new_rounded),
                    label: const Text('Formulaire de contact'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    kSupportEmail,
                    textAlign: TextAlign.center,
                    style: AppFonts.sans(
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({required this.fact});

  final JoiningFact fact;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(
              Icons.check_circle_outline_rounded,
              size: 22,
              color: scheme.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fact.title,
                  style: AppFonts.sans(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: scheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  fact.text,
                  style: AppFonts.sans(
                    fontSize: 14,
                    height: 1.4,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SlotCard extends StatelessWidget {
  const _SlotCard({required this.slot});

  final RehearsalSlot slot;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            slot.group,
            style: AppFonts.sans(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${slot.when}, ${slot.place}',
            style: AppFonts.sans(fontSize: 14, color: scheme.onSurface),
          ),
          Text(
            slot.rhythm[0].toUpperCase() + slot.rhythm.substring(1),
            style: AppFonts.sans(fontSize: 13, color: scheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.number, required this.text, required this.style});

  final int number;
  final String text;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ExcludeSemantics(
            child: Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: scheme.primary,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$number',
                style: AppFonts.sans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: scheme.onPrimary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Semantics(
              label: 'Étape $number',
              child: Text(text, style: style),
            ),
          ),
        ],
      ),
    );
  }
}
