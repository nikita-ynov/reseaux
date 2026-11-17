# Réseaux — outil d'étude

Site statique (HTML/CSS/JS, aucune dépendance, aucun build) : cours NAT, DHCP, OSPF, RIPng/EIGRP, Mémo Cisco IOS.
Cartes à répétition espacée, quiz, examen, entraînement aux commandes, 9 simulateurs. 100 % en français, mobile d'abord, installable (PWA) et utilisable hors ligne.

## Test en local

    python -m http.server 8765 --directory site
    # puis http://localhost:8765

## Déploiement sur Vercel

**Option A — CLI** (depuis ce dossier) :

    npm i -g vercel
    vercel          # aperçu
    vercel --prod   # production

`vercel.json` (racine) définit `outputDirectory: site`.

**Option B — GitHub** : pousser le dépôt, « Add New Project » sur vercel.com, Framework = Other, Build Command vide (l'Output Directory `site` vient de `vercel.json`).

**Option C** : Root Directory = `site` dans les réglages du projet (un `vercel.json` y est aussi présent).

Le dossier `docs/` (PDF sources) est exclu du déploiement via `.vercelignore`.

## Structure

    site/index.html          coquille de l'application
    site/css/style.css       design (desktop)
    site/css/mobile.css      adaptations mobile (barre d'onglets, cibles tactiles…)
    site/js/lessons.js       contenu des 7 cours
    site/js/cards.js         cartes, quiz, exercices de commandes
    site/js/sims.js          9 simulateurs
    site/js/app.js           routage, progression, recherche
    site/sw.js               hors ligne (PWA)
