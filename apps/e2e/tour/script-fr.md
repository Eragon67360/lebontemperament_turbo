# Script de la vidéo « Le nouvel espace d'administration »

Draft 1, 2026-10-10. Each scene is a short clip: **Écran** says what the recording shows (it drives the Playwright tour), and **Voix** is the narration ElevenLabs reads. It's recorded on admin-dev (fake data), signed in as a superadmin. Estimated length: about 9 minutes in total, 1 to 1.5 minutes per chapter. Every button name below was checked against the code (`apps/admin`, dev head 86aec28).

Thomas: edit the **Voix** lines directly, or tell me what to change. Lines I'm unsure about are marked ⚠.

---

## Chapitre 0 · Introduction

### 0.1 Connexion

**Écran** : page « Connexion », on tape l'e-mail et le mot de passe, clic sur « Se connecter ».
**Voix** : Bonjour à toutes et à tous ! L'espace d'administration du Bon Tempérament a fait peau neuve. Même adresse, mêmes identifiants : vous vous connectez avec le compte que vous utilisez déjà sur le site des membres. Je vous fais faire le tour, en quelques minutes.

## Chapitre 1 · L'accueil et le menu

### 1.1 Accueil

**Écran** : l'accueil. Zoom doux sur « Bonjour », puis la carte « Prochain concert », puis « À faire », puis « À venir ».
**Voix** : Voici l'accueil. Il vous dit bonjour, ou bonsoir selon l'heure, et vous rappelle combien de jours il reste avant le prochain concert. Juste en dessous, « À faire » rassemble ce qui attend une décision de votre part : un témoignage à modérer, un message non lu, une synchronisation qui a échoué. Quand il n'y a rien, c'est écrit, et vous pouvez aller boire un café.

### 1.2 Que voulez-vous faire ?

**Écran** : défilement vers « Que voulez-vous faire ? », puis « Activité récente ».
**Voix** : Plus bas, « Que voulez-vous faire ? » reprend chaque partie du menu, avec une ligne d'état pour savoir d'un coup d'œil où on en est. Et « Activité récente » montre qui a modifié quoi. Rassurez-vous, rien ne se modifie depuis l'accueil : c'est un tableau de bord, pas un bouton rouge.

### 1.3 Le menu

**Écran** : survol lent du menu de gauche, section par section, jusqu'à « Voir le site public » et le compte en bas.
**Voix** : Sur la gauche, le menu. Tout est rangé par thème : les concerts et le site public, la saison des membres, les membres et les accès, l'association, et en bas, les projets, comme la campagne des quarante ans. Chaque page commence par une phrase qui dit à quoi elle sert. Et quand une page est un peu technique, cliquez sur « Comment ça marche ? » : l'explication se déplie.

### 1.4 La recherche

**Écran** : clic sur « Rechercher », on tape « concert », les groupes « Pages », « Membres », « Concerts » apparaissent, Entrée.
**Voix** : Mon raccourci préféré : la recherche. Cliquez sur « Rechercher », ou tapez Commande K sur Mac, Contrôle K sur PC. Tapez quelques lettres : une page, un membre, un concert. Pas besoin des accents ni des majuscules. Entrée, et vous y êtes.

### 1.5 Votre compte

**Écran** : ouverture du menu du compte : « Messages », « Signaler un problème », « Thème », « Densité des listes ».
**Voix** : En bas du menu, votre compte. Vous y choisissez le thème, clair ou sombre, et la densité des listes, si vous aimez voir beaucoup de lignes d'un coup. « Signaler un problème » m'envoie un message directement, et mes réponses arrivent dans « Messages ». Une idée, un bug, une phrase pas claire : n'hésitez pas.

## Chapitre 2 · Concerts et site public

### 2.1 Concerts et tournées

**Écran** : « Concerts et tournées », onglet « À venir », ouverture d'un concert avec « Modifier », défilement jusqu'à « Aperçu sur le site public », puis « Annuler ».
**Voix** : Cette partie, c'est tout ce que le public voit sur le site. Commençons par les concerts. « Ajouter un concert » ouvre une fiche en trois blocs : le concert, l'organisation, et ce qui est montré au public. À droite, l'aperçu vous montre le résultat sur le site. Attention : dès que vous enregistrez, le concert est en ligne. Les tournées regroupent plusieurs concerts, avec « Gérer les concerts ».

### 2.2 Supprimer sans stress

**Écran** : sur une ligne de concert, clic sur « ⋯ », survol de « Supprimer… », la fenêtre de confirmation s'ouvre, clic sur « Annuler ».
**Voix** : Un mot sur la suppression, valable partout : elle est rangée dans le petit menu à trois points, et elle demande toujours une confirmation. Impossible de supprimer un concert d'un clic malheureux.

### 2.3 Histoires de concerts et vidéos

**Écran** : « Histoires de concerts », survol de « Prévisualiser » ; puis « Vidéos », une ligne avec sa miniature YouTube.
**Voix** : « Histoires de concerts », ce sont les pages qui racontent nos projets passés, avec leurs photos. « Prévisualiser » vous montre la page avant tout le monde. Dans « Vidéos », il suffit de coller un lien YouTube et de remplir le titre, le compositeur et le lieu.

### 2.4 Annonces

**Écran** : « Annonces », les deux emplacements « Accueil » et « Campagne de dons », les badges « Brouillon », « Programmée », « Sur le site ».
**Voix** : Les annonces, ce sont les boutons mis en avant sur le site : sous le titre de l'accueil, ou dans la carte de la campagne de dons. Une annonce peut rester en brouillon, être programmée à une date, puis s'arrêter toute seule. Le badge vous dit toujours où elle en est.

### 2.5 Rejoindre et FAQ

**Écran** : « Rejoindre et FAQ », « Horaires des répétitions », puis « Questions fréquentes », ouverture d'une question.
**Voix** : Enfin, « Rejoindre et FAQ » : les horaires des répétitions et les questions fréquentes, telles qu'elles apparaissent sur la page « Nous rejoindre ». Une question mal posée par un futur choriste ? Ajoutez-la ici, la réponse est en ligne dans les minutes qui suivent.

## Chapitre 3 · Saison des membres

### 3.1 Partitions et documents

**Écran** : « Partitions et documents », survol de « Synchroniser depuis Drive », puis la section « Synchronisation avec Drive » et les programmes.
**Voix** : La saison des membres, c'est ce que les choristes retrouvent dans leur espace et dans l'application. Les partitions viennent de notre Google Drive. Une synchronisation a lieu chaque nuit, mais vous pouvez la lancer vous-même avec « Synchroniser depuis Drive ». L'outil vous montre d'abord ce qui va changer, et rien n'est modifié tant que vous ne cliquez pas sur « Appliquer ». Et rassurez-vous, le Drive lui-même n'est jamais touché.

### 3.2 Répétitions

**Écran** : « Répétitions », filtre par groupe, une ligne avec le badge « Google Agenda », ouverture de la fiche.
**Voix** : Les répétitions arrivent toutes seules depuis l'agenda Google de l'association, chaque heure. Vous pouvez filtrer par groupe, et ajouter une séance, même une série de séances, toutes les semaines jusqu'à une date. Pour une répétition venue de Google, si vous corrigez le lieu, l'adresse ou la salle, la correction est recopiée dans l'agenda. Mais si quelqu'un modifie ensuite l'événement dans Google, c'est Google qui a le dernier mot.

### 3.3 Événements

**Écran** : « Événements », badges « Concert », « Séjour », « Vente », « Public », « Membres ».
**Voix** : Les événements, c'est tout le reste : un séjour, une vente de gâteaux, une sortie. Pour chacun, vous choisissez s'il reste entre membres ou s'il est aussi visible sur le site public.

## Chapitre 4 · Membres et accès

### 4.1 La liste des membres

**Écran** : « Membres », on tape dans « Nom ou e-mail », filtres « Toutes les voix » et « Tous les statuts ».
**Voix** : Voici la liste des membres qui ont un compte. Pour trouver quelqu'un, tapez son nom, ou appuyez sur la touche barre oblique pour aller directement dans la recherche. Les filtres trient par voix, par statut, par rôle. La colonne « Dernière connexion » vous dit qui utilise vraiment le site.

### 4.2 La fiche d'un membre

**Écran** : « ⋯ » sur une ligne, « Voir la fiche », la fiche avec « Coordonnées », « Accès », « Actions sensibles ».
**Voix** : Le menu à trois points mène à la fiche du membre : ses coordonnées, sa voix, sa photo, son rôle. Les coordonnées viennent de la liste officielle des membres, notre tableau Excel : c'est lui qui fait référence. Si le compte et le tableau ne disent pas la même chose, la fiche vous le signale, et un clic applique la valeur du tableau.

### 4.3 Synchroniser avec la liste

**Écran** : clic sur « Synchroniser avec la liste », les étapes « Vérifier », « Choisir », « Appliquer », les groupes « Nouveaux », « Modifiés », « À régler ».
**Voix** : Quand de nouveaux choristes arrivent, cliquez sur « Synchroniser avec la liste ». L'outil compare le tableau avec les comptes : les nouveaux, ceux qui ont changé, ceux qui sont à régler. Vous cochez ce que vous voulez, vous appliquez, et les nouveaux reçoivent leur invitation par e-mail. Aucun compte n'est supprimé, et le tableau Excel n'est jamais modifié.

### 4.4 Liste de diffusion

**Écran** : « Liste de diffusion », le choix du groupe, les chiffres.
**Voix** : « Liste de diffusion » vous montre qui est inscrit à nos groupes d'e-mails Google. C'est une page de consultation : on regarde, on ne touche pas.

## Chapitre 5 · Association

### 5.1 Documents de l'association

**Écran** : « Documents de l'association », les collections, un document avec « Public » ou « Membres », « ⋯ » puis « Historique » et « Restaurer ».
**Voix** : Dans la partie Association, les documents officiels : statuts, programmes, comptes. Pour chacun, vous choisissez qui le voit : les membres seulement, ou aussi le public. Et chaque modification est gardée : « Historique » vous permet de revenir à une version précédente. Un document qui n'est plus d'actualité ? Archivez-le, et si vous vous êtes trompé, « Annuler » le remet aussitôt.

### 5.2 Assemblée générale

**Écran** : « Assemblée générale », une AG en « Brouillon », ouverture de la fiche, « Aperçu ».
**Voix** : « Assemblée générale » prépare la page de l'AG sur le site : la date, le lieu, la convocation, le formulaire de procuration. Tant qu'elle est en brouillon, personne ne la voit. Quand elle est prête, publiez-la, et elle peut même être annoncée sur l'accueil du site.

### 5.3 Comptes rendus du CA

**Écran** : « Comptes rendus du CA », « Ajouter un compte rendu ».
**Voix** : Les comptes rendus du conseil d'administration, eux, se déposent en PDF, avec la date de la réunion. Les membres les retrouvent dans leur espace.

### 5.4 Signalements

**Écran** : le menu du compte, survol de « Signaler un problème » (la page « Signalements » n'est pas filmée : elle est réservée aux super-administrateurs).
**Voix** : Dernière page, réservée aux super-administrateurs : les signalements. Tout ce que vous et les membres envoyez avec « Signaler un problème », depuis le site ou l'application, arrive ici, et on peut y répondre. Si vous ne voyez pas cette page, c'est normal.

## Chapitre 6 · La campagne des quarante ans

### 6.1 Vue d'ensemble

**Écran** : « Campagne 40 ans », les étapes « Préparer », « Vérifier », « Publier », la liste « Prêt », « À vérifier », « Vide ».
**Voix** : Dans les projets, la campagne des quarante ans. La vue d'ensemble vous dit, section par section, ce qui est prêt, ce qui est à vérifier, et ce qui est encore vide. Un clic sur une ligne vous emmène au bon endroit.

### 6.2 Le contenu

**Écran** : « En-tête de la page », la barre « Rien ne change sur le site avant « Enregistrer » », puis « Chronologie » avec « Monter » et « Descendre ».
**Voix** : Chaque section se remplit de la même façon. Vous modifiez, et rien ne change sur le site avant d'avoir cliqué sur « Enregistrer ». Dans les listes, vous masquez un élément sans le supprimer, et vous changez l'ordre avec les flèches ou en glissant la ligne.

### 6.3 Les témoignages

**Écran** : « Modération », onglet « En attente », survol de « Publier » et « Mettre à la une » (rien n'est publié pendant le tournage).
**Voix** : Les témoignages envoyés par le public arrivent dans « Modération ». Rien n'est publié sans vous : lisez, publiez, et mettez les plus beaux à la une.

### 6.4 Publier la page

**Écran** : retour à la vue d'ensemble, carte « Publication », clic sur « Publier la page », la fenêtre avec « J'ai vérifié le contenu », puis « Annuler ».
**Voix** : Quand tout est prêt, « Publier la page » la met en ligne, après une dernière confirmation. Et on peut la masquer à nouveau à tout moment.

## Chapitre 7 · Conclusion

### 7.1 Pour finir

**Écran** : retour à l'accueil, fondu sur le logo.
**Voix** : Voilà pour le tour ! Retenez trois choses : chaque page vous dit à quoi elle sert, rien de grave ne se fait sans confirmation, et « Signaler un problème » est là pour toutes vos questions. Prenez le temps de cliquer un peu partout, vous ne casserez rien. Merci à vous, et à très bientôt en répétition !

---

## Notes for Thomas

- ⚠ 2.2 says deleting always asks for confirmation: true everywhere in the code. Some deletions are superadmin-only (announcements, FAQ, documents, AG, accounts); the script doesn't go into that detail. Tell me if your admins should hear it.
- ⚠ 3.2: write-back to Google is on in production (`CALENDAR_WRITEBACK`). If you ever switch it off, that sentence has to go.
- ⚠ 5.1 « statuts, programmes, comptes » are examples. Swap in the collections you really use.
- « Changer l'e-mail… », role changes and account deletion aren't shown, on purpose: they're superadmin-only and rare. They can get a short extra clip if you like.
- The roster-sync title-row fix (#661) and the admin voice edit (#660) are on dev and not in production yet, so the script doesn't mention them.
- Count (measured): 1,266 words, 7,720 characters in 27 scenes. Voicing it once uses about a quarter of the Starter plan's 30,000 monthly credits.
