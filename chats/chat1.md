# Jeu TV Qui est-ce animé

_Started 2026-09-14 20:16 UTC_

---

## User

Crée l'identité visuelle d'un jeu TV multijoueur façon "Qui est-ce ?" sur PS5, mais animé et festif. Le jeu se joue sur un grand écran (TV/salon) pendant que les joueurs votent depuis leur téléphone.

Concept central : chaque joueur est représenté par un personnage illustré en 2D, stylisé et un peu cartoon, généré à partir de ses traits physiques (coiffure, couleur de peau, silhouette, style vestimentaire). Ce ne sont pas des avatars génériques : chaque perso doit avoir une vraie identité visuelle, façon planche de "Qui est-ce ?" revisitée en version pop et vivante.

Ambiance et palette : fun, chaleureuse, énergique — palette corail, ambre et rose poudré sur fond sombre ou neutre pour faire ressortir les personnages. Formes rondes, pas d'angles agressifs. Typographie ronde et bold, très lisible à distance (écran TV).

Scène principale : le dancefloor. Pendant qu'un morceau joue, tous les personnages des joueurs sont affichés côte à côte sur une piste de danse stylisée, chacun avec sa propre animation de danse en boucle (mouvements variés pour éviter l'effet clone — chacun un peu décalé dans son style). Ambiance boîte de nuit légère : spots de lumière discrets, sol qui pulse doucement au rythme, quelques confettis ou particules qui tombent.

Réactions dynamiques : au moment du vote et de la révélation, les personnages doivent réagir visuellement — un perso "grillé" qui se cache le visage ou rougit, un perso qui esquive en mode "c'est pas moi", des réactions de surprise/rire/déception pour les votes corrects ou faux, une petite pluie de confettis sur le gagnant du round.

Écrans à décliner :

Écran de lobby (QR code + code à 4 chiffres, liste des personnages qui arrivent un par un sur le dancefloor)
Écran "musique en cours" (dancefloor animé, tous les persos dansent, minuteur de vote discret)
Écran de révélation (le bon perso est mis en lumière, réactions des autres)
Écran de score (classement avec les personnages dans des poses différentes selon leur position)

Ton général : jeu de soirée entre amis, pas compétitif/sérieux — proche de l'esprit Jackbox mais avec une vraie identité de personnages personnalisés, façon mini Fortnite party royale rencontre Qui est-ce.

## Assistant

I'll build this as a character-driven system: one `Dancer` component that generates a distinct persona from traits, plus the four TV screens.

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

**GRILLÉ !** — identité visuelle sur un canvas pannable : bandeau d'identité (palette corail/ambre/rose poudré sur nuit, Fredoka + Nunito, lineup de persos) puis les 4 écrans TV en 1280×720.

- `Dancer.dc.html` est le système de personnage : traits (peau, 7 coiffures, couleur de cheveux, tenue, accessoire) + 6 boucles de danse décalées et 8 états de réaction (grillé mains sur le visage + rougeur + goutte, esquive, rire, surprise, déception, victoire, idle).
- Les écrans partagent le même dancefloor (spots qui oscillent, sol en perspective qui pulse au rythme, confettis).
- Tweaks dispo : tempo, noms affichés, confettis — et chaque perso est modifiable trait par trait via ses props.

Dites-moi si vous voulez l'écran téléphone (vote) en complément, ou plus de coiffures/accessoires dans la banque de traits.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Bras repivotés à l'épaule (les réactions bras-en-l'air lisent correctement maintenant) et pastille de nom descendue pour ne plus toucher les chaussures.

## User

Crée les écrans mobiles (téléphone) d'un party game musical à jouer en groupe, en complément d'un grand écran TV. Le téléphone sert de manette : rejoindre la partie, créer son personnage, voter. Même univers que l'écran TV : fun, festif, façon "Qui est-ce ?" revisité en version pop, avec des personnages illustrés façon cartoon qui dansent sur un dancefloor.

Ambiance et palette : corail, ambre, rose poudré, fond sombre ou neutre. Formes rondes, gros boutons faciles à taper, typographie ronde et bold. L'interface doit rester simple et lisible même dans le noir/en soirée, avec peu de texte et des zones de tap généreuses.

Écrans à décliner :

Écran de connexion — bouton "rejoindre la partie" avec scan QR code intégré, ou saisie manuelle d'un code à 4 chiffres. Ambiance accueillante, logo du jeu, peut-être une preview animée du dancefloor en fond.
Connexion Spotify — écran de transition avant l'auth Spotify, ton ludique ("connecte ta musique pour révéler tes titres secrets" ou équivalent), gros bouton vert Spotify bien identifiable mais intégré à la charte du jeu.
Création du personnage — l'écran le plus important : un éditeur simple façon "Qui est-ce ?" où le joueur choisit les traits physiques de son perso (coiffure, couleur de peau, style vestimentaire, accessoires) via des carrousels ou des vignettes à sélectionner, avec un aperçu du perso en grand qui se met à jour en live et qui danse déjà un peu pour donner le ton. Champ pour nommer son personnage.
Écran d'attente en lobby — confirmation que le perso est prêt, liste des autres joueurs connectés (mini-icônes de leurs persos), message d'attente sympa pendant que les autres finissent de se créer.
Écran de vote — pendant qu'un morceau joue sur la TV, le joueur voit une grille de tous les personnages des joueurs (sauf le sien si c'est son morceau) et tape sur celui qu'il pense être le propriétaire du titre. Feedback visuel immédiat au tap (le perso sélectionné se met en surbrillance), petit timer de compte à rebours visible mais discret.
Écran de vote (unique, pour tous les joueurs y compris le propriétaire du morceau) — pendant qu'un morceau joue sur la TV, tous les joueurs (y compris celui à qui appartient le morceau) voient la même grille avec tous les personnages, le sien inclus, et tapent sur celui qu'ils pensent être le propriétaire. Pas de distinction visuelle qui trahirait le propriétaire aux autres joueurs — l'écran doit être strictement identique pour tout le monde, seul le contenu de la décision change en interne. Feedback visuel immédiat au tap, timer de compte à rebours discret.

Ton général : interface de jeu de soirée, réactive, un peu bruyante visuellement mais jamais confuse — l'objectif principal (voter vite, bien) doit toujours être évident en un coup d'œil.

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

Six écrans téléphone (390×844) dans `Grille - Ecrans mobiles.dc.html`, même univers que la TV et mêmes persos.

- **Rejoindre** : dancefloor animé en fond derrière un voile, gros bouton scan QR + 4 cases de code.
- **Spotify** : perso au casque, bouton vert #1DB954 avec ombre portée comme les autres boutons du jeu, échappatoire "jouer sans ma musique".
- **Ton perso** : éditeur cliquable — 7 coiffures (vignettes mini-tête), 5 peaux, 5 tenues, 5 accessoires ; l'aperçu danse et se met à jour en live, champ nom éditable.
- **Salle d'attente**, **Vote** (grille 2×4 cliquable, tous les persos sans distinction, timer discret, CTA qui s'active au tap) et **Vote verrouillé** (surbrillance corail + perso surpris).

L'écran de vote est volontairement unique : aucune marque ne distingue le propriétaire du morceau.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Grilles de vote corrigées : cartes en `border-box` (124 px), gap 10 px, persos à l'échelle 0.38 — les 4 rangées tiennent au-dessus des boutons dans les deux écrans.

