# Accès à la page 40 ans

Les entrées vers `/40-ans` reprennent la direction « Le Programme » de la page (choix du propriétaire, 13 octobre 2026) : une page du programme, en Bodoni Moda et EB Garamond sur le papier de la page, sans emoji, sans dégradé ni animation. Elles s'affichent quand le drapeau `anniversary_40_years` est actif, ou pour les admins.

Toutes sont dans `components/anniversary/AnniversaryEntry.tsx` :

| Entrée                                 | Où                                                                                            | Fichier qui l'affiche                |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `AnniversaryNavLink`                   | Navigation bureau : le mot « 40 ans » en Bodoni italique, à la suite des autres liens         | `components/links/MainLinks.tsx`     |
| `AnniversaryMenuLink`                  | Menu téléphone : une ligne de papier « 40 ans · 1987 — 2027 · le programme » en fin de liste  | `components/links/MainMenuLinks.tsx` |
| `AnniversaryHeroCard variant="corner"` | Accueil, bureau : petit carton du programme en bas à gauche de la photo, qui défile avec elle | `components/HomeContent.tsx`         |
| `AnniversaryHeroCard variant="inline"` | Accueil, téléphone et tablette : billet sous les deux boutons                                 | `components/HomeContent.tsx`         |

Les polices viennent de `programme/entryFonts.ts`, sans préchargement : elles ne sont téléchargées que lorsqu'une entrée est à l'écran. Le papier du carton de l'accueil reste clair dans les deux thèmes (il est posé sur la photo sombre) ; la ligne du menu suit les tons clair et sombre de la page (`PROGRAMME_TOKENS` dans `programme/theme.ts`).

L'ancienne bulle flottante « 40 » avec un gâteau (confettis, suivi de la souris) a été retirée le 13 octobre 2026.
