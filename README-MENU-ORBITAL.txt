# Mise à jour du menu — Restaurant

La section « Plats populaires » de `index.html` a été remplacée par un carrousel orbital animé.

## Utilisation
- Ouvrir `index.html` dans un navigateur avec une connexion Internet (GSAP est chargé depuis jsDelivr).
- Faire défiler la section pour passer d'un plat au suivant.
- Utiliser les flèches, les pastilles latérales, les miniatures, les touches gauche/droite ou le balayage tactile.
- Le bouton « Ajouter au panier » réutilise la fonction `addToCart` déjà présente dans `script.js`.

## À propos de la stack
Le projet fourni est un site statique HTML/CSS/JavaScript : il ne contient ni React, ni TypeScript, ni Tailwind, ni shadcn/ui. Pour éviter une migration lourde et préserver les pages panier/contact et les fonctions existantes, le comportement visuel du composant fourni a été adapté en JavaScript natif avec GSAP/ScrollTrigger. Le fichier React original n'a donc pas été ajouté tel quel.

## Fichiers modifiés
- `index.html` : nouvelle section du menu et chargement GSAP.
- `style.css` : styles responsive du carrousel.
- `script.js` : navigation, animations, défilement et ajout au panier.


## Mise à jour : tapis roulant « Spécialité du jour »
La section `#menu` (la grille de 6 cartes) est remplacée par un tapis roulant d'assiettes en perspective.
- Survol : le tapis s'arrête et l'assiette se soulève. Glisser (souris ou doigt) : on fait tourner le tapis.
- Clic sur une assiette : fenêtre avec description, prix, « Ajouter au panier » et favoris.
- Clavier : Tab puis flèches gauche/droite, Entrée pour ouvrir, Échap pour fermer. Respecte « réduire les animations ».
- Pour changer les plats : modifier la liste `DISHES` en haut de `conveyor-menu.js`.
- Le bord coloré de chaque assiette dépend du prix (légende au-dessus du tapis).

Fichiers : `index.html` (section), `conveyor-menu.js` (nouveau), `style.css` (fin du fichier), `script.js` (addToCart/addToFavorites acceptent maintenant une image et un prix en plus).


## Mise à jour : « La sélection du chef » (carrousel orbital)
La section `#dishes` est refaite : le plat sort par le haut sur une grande orbite pendant que le suivant arrive,
le titre s'efface en deux traits (fin / gras), la carte de droite change (note, prix, aperçu / ingrédients)
et un ruban coloré derrière le plat change de couleur.
- Défilement : la section reste fixe, chaque cran de scroll amène le plat suivant. Après le dernier plat, la page continue normalement.
- Aussi : flèches et miniatures, pastilles à gauche, touches gauche/droite, balayage au doigt, « Ajouter au panier » et « Favoris ».
- Pour changer les plats : liste `DISHES` en haut de `dish-orbit.js` (nom, prix, photo, note, description, ingrédients, couleur).
- Ancien code orbital supprimé de `script.js` et `style.css`. Police Outfit ajoutée dans `index.html` (Google Fonts).
- Les ingrédients sont des exemples à vérifier. Certaines photos ne correspondent pas parfaitement aux noms
  (voir `DISHES`) : remplace-les par de vraies photos de tes plats (idéalement vues du dessus, fond transparent, carrées).

Fichiers : `index.html`, `dish-orbit.js` (nouveau), `style.css`, `script.js`.


## Mise à jour : hero identique au composant « Hero Section 41 » (#home)
Reproduction fidèle du composant (texte + 2 boutons à gauche, grande assiette à droite, miniatures en arche et avis en bas),
en HTML/CSS/JS natif : aucune dépendance (ni React, ni Embla, ni Tailwind). Le header du site est conservé (panier, favoris, recherche).
- `hero-41.js` (nouveau) : trois carrousels synchronisés en boucle, défilement auto toutes les 3 s, clic sur une miniature,
  balayage tactile, flèches du clavier. Le défilement s'arrête au survol/focus et si « réduire les animations » est activé.
- Images et avatars : mêmes liens `cdn.21st.dev` que le composant. Avant la mise en ligne, les télécharger dans `IMAGE/`
  et remplacer les `src` dans `index.html` (un CDN tiers peut disparaître), puis mettre de vrais plats et de vrais noms.
- Les 4 avis sont des TEXTES D'EXEMPLE traduits du composant : à remplacer par de vrais avis de clients avant la mise en ligne.
- Le bouton « Nous contacter » mène à `contact.html` (le site n'a pas de réservation de table).
- Couleur principale des boutons : orange foncé #c2410c (contraste 5,2:1 avec le texte blanc).


## Mise à jour : section « Une envie ? Commandez en ligne » (#float-cta)
Section ajoutée juste avant le formulaire de commande (#order), adaptée du composant « FloatingFoodHero » en HTML/CSS pur.
- Un seul bouton « Passer commande » qui mène au formulaire (#order).
- Six images flottantes identiques au composant d'origine (cheeseburger, raviolis vapeur, part de pizza, feuille de basilic, 2 tranches de tomate), placées aux mêmes endroits.
- Elles sont chargées depuis le CDN `cdn.21st.dev` (liens du composant). Avant la mise en ligne, téléchargez-les dans `IMAGE/` et changez les `src` dans `index.html` : un CDN tiers peut disparaître et ralentit la page.
- L'animation (léger va-et-vient) est désactivée si le visiteur a choisi « réduire les animations ».


## Mise à jour : témoignages (#review), d'après « unique-testimonial »
La section « Avis du client » (slider Swiper) est remplacée par le sélecteur de témoignages du composant, en JavaScript natif.
- `testimonials.js` (nouveau) : un clic sur une pastille change l'avis (le texte s'efface en flou, change, puis réapparaît).
  Sans animation si le visiteur a choisi « réduire les animations ».
- Les 4 avis et noms sont ceux qui existaient déjà dans la page. Ce sont des textes d'exemple : à remplacer par de vrais avis
  de clients avec leur accord (modifier les attributs `data-quote` et les noms dans `index.html`).
- Pas de photos : les pastilles affichent les initiales (aucune fausse photo). Pour des vraies photos, remplacer le `<span class="tm-avatar">` par une `<img>`.
- Swiper (CSS et JS) est supprimé : il n'était plus utilisé nulle part sur la page d'accueil.


## Mise à jour : footer « Wordmark » (#footer)
Le footer est une adaptation en HTML/CSS pur du composant « Wordmark Footer » (aucun JavaScript, aucune dépendance ; seule l'année du © est mise à jour par une ligne de script).
- `wordmark-footer.css` (nouveau) : styles isolés des règles globales du site. Couleurs : variables `--wmf-*` en haut du fichier.
- Sur ordinateur : 4 colonnes de liens. Sur téléphone : chaque colonne se replie (balise `<details>`), zones tactiles de 44 px minimum.
- Le nom « Fast Food » est affiché très grand en bas, en orange qui s'estompe (décoratif, masqué aux lecteurs d'écran).
- Le contenu est dans `index.html`, dans `<footer id="footer">`. Les colonnes sont écrites deux fois (version ordinateur et version téléphone) : modifier les deux.
- À FAIRE avant la mise en ligne : vrais liens des réseaux sociaux (actuellement `#`), vrais numéros et e-mails, pages Politique de confidentialité et CGU (à ajouter dans `.wmf-bottom`).


## Mise à jour : navbar liquide (remplace la barre basse)
La barre du haut (`#nimbus-bar`) remplace l'ancien `<header>` et se compose de trois pilules de verre séparées :
- à gauche, le logo « Fast Food » (lien vers l'accueil) ;
- au centre, la navigation liquide `#liquid-nav` (Accueil, Plats, À propos, Menu, Critiques, Commander) avec la goutte d'eau qui suit la section active ;
- à droite, recherche, favoris et panier (compteurs `#favCount` / `#cartCount` conservés).
- Sous 1100 px, la navigation centrale passe en icônes seules ; sous 700 px elle se place en barre flottante en bas de l'écran (logo et boutons restent en haut).
- Port en JavaScript natif du composant React « Liquid Navbar / Waterline » (Nimbus UI) : aucune dépendance. Shader WebGL, repli sur une goutte CSS sans WebGL, pause hors écran, respect de « réduire les animations ».
- La section visible est suivie au défilement ; un clic lance le défilement sans que l'eau saute entre les sections traversées.
- Fichiers : `liquid-nav.js`, `liquid-nav.css`, `<nav id="liquid-nav">` dans `index.html`. Pour changer les liens : modifier les `<a class="nimbus-item">` de `#liquid-nav` (attribut `data-fx` : glow, spin, pop, wave, drop, plane, none).
- Sous 520 px de large, seules les icônes sont affichées (le libellé reste lu par les lecteurs d'écran, et visible en infobulle).
- Le verre est plus opaque que dans l'original (fin de `liquid-nav.css`) pour rester lisible au-dessus du contenu.


## Mise à jour : formulaire de commande
La section `#order` reprend la mise en page du composant « Form layout » (grille à 6 colonnes, libellés avec astérisque, séparateur, boutons Annuler / Commander), en HTML/CSS natif. Le fond dégradé violet et l'effet de verre de l'ancienne section sont supprimés.
- Les attributs `name` des champs sont inchangés (`name`, `Number`, `food name`, `extra with food`, `order`, `date`, `address`, `message`).
- Validation côté navigateur dans `script.js` (messages sous chaque champ, `aria-invalid`, focus sur le premier champ en erreur) : nom, téléphone, quantité 1 à 50, date à venir, adresse.
- Anti-spam : champ piège invisible `website` et délai minimal de 3 secondes avant envoi.
- ATTENTION : la commande n'est envoyée nulle part (le site est statique) : elle affiche seulement une notification. Il faut un backend ou un service de formulaire, avec une validation côté serveur, avant la mise en production. La redirection « connexion.html » pointe vers une page absente du projet.


## Mise à jour : apparition des sections au défilement
Le contenu de chaque section apparaît (léger fondu + montée de 28 px, 0,7 s) quand il entre dans l'écran. Les éléments d'une même section arrivent avec un petit décalage (90 ms).
- Fichiers : `scroll-reveal.js` et `scroll-reveal.css` (nouveaux), chargés dans `index.html`. Aucune dépendance (IntersectionObserver natif).
- Sections animées : intro de « La sélection du chef », À propos, Menu, Critiques, « Une envie ? », formulaire de commande, pied de page.
- Volontairement NON animés : le hero (visible dès l'arrivée, pour garder un affichage rapide), le carrousel épinglé de #dishes (géré par ScrollTrigger) et les images flottantes de #float-cta (déjà animées en CSS).
- Les fonds de section ne bougent pas : seul le contenu apparaît.
- Rien n'est masqué sans JavaScript, ni pour les éléments déjà visibles au chargement. Désactivé si le visiteur a choisi « réduire les animations ».
- Les classes d'animation sont retirées une fois l'effet terminé : les survols et animations existants ne sont pas affectés.
- Pour animer autre chose : ajouter un sélecteur dans la liste `TARGETS` en haut de `scroll-reveal.js`. Pour changer la vitesse : `transition` dans `scroll-reveal.css`.
