# Application de Visualisation des Options - Montreal Exchange

## 📋 Vue d'ensemble

Application frontend pour visualiser les données des options scrapées depuis le Montreal Exchange via un workflow n8n.

## 🏗️ Architecture

### Flux de données
1. **Frontend** : L'utilisateur sélectionne un symbole et clique sur "Scraper les données"
2. **API Route** : `/api/scrape` fait un proxy vers le webhook n8n (évite les problèmes CORS)
3. **n8n Webhook (GET)** : Reçoit le paramètre `symbol` et lance le workflow
4. **n8n Workflow** : Scrape les données du Montreal Exchange
5. **Webhook Response** : n8n répond avec les données JSON via "Respond to Webhook"
6. **Frontend** : Crée un nouvel onglet avec les données et affiche dans un tableau

```
[Frontend] --POST /api/scrape--> [Next.js API Route]
                                       |
                                       v
                              [n8n Webhook GET + ?symbol=XXX]
                                       |
                                       v
                                  [Scraping Workflow]
                                       |
                                       v
                              [Respond to Webhook (JSON)]
                                       |
                                       v
[Frontend] <--JSON Response (tableau)--
     |
     v
[Système d'onglets avec historique]
```

## 🎯 Fonctionnalités Implémentées

### ✅ Phase 1 - MVP (Complété)
- [x] Sélection de symbole via liste déroulante (BTCQ, ETH, ETHQ, BTC)
- [x] Bouton pour déclencher le scraping
- [x] Affichage des données dans un tableau organisé
- [x] Organisation intelligente : Call puis Put avec même date et strike
- [x] Tri automatique par date croissante puis strike price
- [x] Coloration des lignes (Call = vert, Put = rouge)
- [x] État de chargement avec spinner pendant le scraping
- [x] Gestion complète des erreurs

### ✅ Filtres Avancés
- [x] Type (Call/Put)
- [x] Plage de dates (Date Min/Max) avec date picker
- [x] Strike price (min/max)
- [x] Volatilité (min/max)
- [x] Type d'option (Weekly/Standard)
- [x] Bouton "Réinitialiser" pour effacer tous les filtres

### ✅ Tri des Données
- [x] Tri par Date
- [x] Tri par Strike_price
- [x] Tri par volatility
- [x] Tri par open_interest
- [x] Tri par bid_price
- [x] Tri par ask_price
- [x] Indicateur visuel ascendant/descendant (↑/↓)
- [x] Toggle asc/desc au clic

### ✅ Système d'Onglets avec Historique
- [x] Conservation de toutes les recherches en onglets
- [x] Navigation entre les onglets
- [x] Fermeture d'onglet avec bouton ×
- [x] Affichage du symbole et timestamp sur chaque onglet
- [x] Indicateur visuel de l'onglet actif
- [x] Les données persistent tant que l'onglet est ouvert

### ✅ Export de Données
- [x] Export CSV avec nom de fichier dynamique
- [x] Filtrage des données exportées selon les filtres actifs
- [x] Échappement correct des caractères spéciaux

### ✅ Sélection de Symboles
- [x] Liste complète de 413+ symboles du Montreal Exchange
- [x] Affichage du nom complet après sélection
- [x] Liste déroulante avec symboles uniquement

### ✅ Analyse IA avec OpenAI
- [x] Intégration de l'API OpenAI (GPT-4o)
- [x] Analyse automatique des données d'options
- [x] Recommandations d'investissement personnalisées
- [x] Identification des options à acheter avec niveau de risque
- [x] Identification des options à éviter avec risques identifiés
- [x] Analyse des risques et stratégies
- [x] Affichage formaté en Markdown avec react-markdown
- [x] Listes numérotées et à puces pour meilleure lisibilité
- [x] Espacement optimal entre sections
- [x] Emojis pour visualisation rapide (📊 ✅ ❌ 💡 ⚠️ 🟢 🟡 🔴)
- [x] Lignes de séparation entre sections
- [x] Avertissement de non-conseil financier

### ✅ Dashboard Dark Mode Professionnel (Complété)
- [x] Interface dark mode complète (`/dark`)
- [x] 4 graphiques analytiques interactifs (Recharts)
  - Volatility Smile (IV par Strike)
  - Volume par Strike (Top 15 liquidité)
  - IV Term Structure (évolution dans le temps)
  - Call/Put Ratio (sentiment du marché)
- [x] Cartes de statistiques en temps réel
- [x] Layout en grille 2x2 responsive
- [x] Thème sombre professionnel (#0f1419, #1e2329)
- [x] Tooltips détaillés sur tous les graphiques
- [x] Export PDF avec prévisualisation
- [x] Capture haute qualité des graphiques
- [x] Analyse IA des données filtrées uniquement

### 🔄 Phase 3 - Améliorations Futures
- [ ] Sauvegarde des données en localStorage
- [ ] Recherche textuelle dans les données
- [ ] Pagination pour grandes quantités de données
- [ ] Comparaison entre plusieurs symboles
- [ ] Historique des analyses IA
- [ ] Personnalisation du prompt IA
- [ ] Graphiques temps réel avec WebSocket

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : TailwindCSS
- **HTTP Client** : Axios
- **State Management** : React Hooks (useState, useMemo, useEffect)
- **IA** : OpenAI API (GPT-4)
- **Markdown Rendering** : react-markdown

## 📁 Structure du Projet

```
/Options model/
├── app/
│   ├── api/
│   │   ├── scrape/
│   │   │   └── route.ts           # API route proxy vers n8n
│   │   └── analyze/
│   │       └── route.ts           # API route pour analyse IA
│   ├── layout.tsx                 # Layout Next.js
│   ├── page.tsx                   # Page principale avec logique
│   └── globals.css                # Styles globaux TailwindCSS
├── components/
│   ├── OptionsTable.tsx           # Tableau avec organisation Call/Put
│   ├── DataFilters.tsx            # Composant de filtrage et tri
│   └── AIAnalysis.tsx             # Composant d'analyse IA
├── .env.example                   # Template pour variables d'environnement
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── PROJECT.md                     # Ce fichier
```

## 📊 Structure des Données

### Format réel des données reçues de n8n

```typescript
interface OptionData {
  id: number;                    // ID unique (caché dans l'UI)
  createdAt: string;             // Date de création (caché)
  updatedAt: string;             // Date de mise à jour (caché)
  Quotes: 'call' | 'put';        // Type d'option
  Symbol: string;                // Ex: "BTCQ  251017C17.50"
  Date: string;                  // Date d'expiration (ISO format)
  Strike_price: number;          // Prix d'exercice
  bid_price: number;             // Prix d'achat
  ask_price: number;             // Prix de vente
  bid_size: number;              // Taille bid
  ask_size: number;              // Taille ask
  net_change: number;            // Changement net
  settlement_price: number;      // Prix de règlement
  open_interest: number;         // Intérêt ouvert
  is_option: number;             // Flag option (0/1)
  is_weekly: number;             // Flag weekly (0/1)
  last_close_price: number;      // Dernier prix de clôture
  open_price: number;            // Prix d'ouverture
  high_price: number;            // Prix le plus haut
  low_price: number;             // Prix le plus bas
  nb_trades: number;             // Nombre de trades
  volatility: number;            // Volatilité
}

// Les données arrivent sous forme de tableau directement
type WebhookResponse = OptionData[];
```

### Colonnes cachées dans l'affichage
- `id`
- `createdAt`
- `updatedAt`

## 🔗 Configuration n8n

### Webhook URL
- **URL Production** : `http://localhost:5678/webhook/f6645a25-ad42-4d85-92e9-f2301bce649d`
- **Méthode** : GET
- **Paramètres** : `?symbol=SYMBOLE` (ex: `?symbol=BTCQ`)

### Configuration dans n8n
1. Node "Webhook" configuré en mode GET
2. Option "Respond to Webhook" activée
3. Retourne un tableau JSON d'options
4. Le symbole est récupéré via `{{ $request.query.symbol }}`

## 🚀 Installation & Démarrage

```bash
# Installation des dépendances
npm install

# Configuration de la clé API OpenAI
# 1. Créer un fichier .env.local à la racine du projet
# 2. Ajouter votre clé API OpenAI :
echo "OPENAI_API_KEY=your_api_key_here" > .env.local

# Développement
npm run dev

# L'application sera accessible sur http://localhost:3000
```

## 🔑 Configuration OpenAI

Pour utiliser l'analyse IA, vous devez :

1. Obtenir une clé API sur [OpenAI Platform](https://platform.openai.com/api-keys)
2. Créer un fichier `.env.local` à la racine du projet
3. Ajouter la ligne : `OPENAI_API_KEY=votre_clé_api`
4. Redémarrer le serveur de développement

**Note** : Le fichier `.env.local` est dans `.gitignore` pour protéger votre clé API.

## 💡 Utilisation

1. **Sélectionner un symbole** : Choisissez dans la liste déroulante (413+ symboles disponibles)
2. **Voir le nom complet** : Le nom de la compagnie s'affiche sous la liste déroulante
3. **Scraper** : Cliquez sur "Scraper les données"
4. **Naviguer** : Un nouvel onglet apparaît avec le symbole et l'heure
5. **Analyser avec IA** : Cliquez sur "Analyser avec IA" pour obtenir des recommandations d'investissement
6. **Filtrer** : Utilisez les filtres pour affiner les résultats
7. **Trier** : Cliquez sur les boutons de tri pour organiser les données
8. **Exporter** : Cliquez sur "Exporter CSV" pour sauvegarder les données filtrées
9. **Comparer** : Gardez plusieurs onglets ouverts pour comparer différents symboles
10. **Fermer** : Cliquez sur × pour fermer un onglet

## ✅ Checklist de Développement

- [x] Documentation initiale (PROJECT.md)
- [x] Initialisation Next.js + TypeScript
- [x] Configuration TailwindCSS
- [x] API route proxy pour éviter CORS
- [x] Sélection de symbole (413+ symboles)
- [x] Affichage du nom complet du symbole
- [x] Hook pour appel webhook
- [x] Composant tableau avec organisation Call/Put
- [x] Composant filtres et tri
- [x] Page principale avec système d'onglets
- [x] Gestion d'état avec historique
- [x] Export CSV
- [x] Intégration OpenAI API
- [x] Composant d'analyse IA
- [x] Recommandations d'investissement IA
- [x] Tests avec données réelles
- [x] Intégration webhook n8n production
- [x] Documentation finale

## 🐛 Issues Résolues

### Problème CORS (Résolu)
- **Problème** : Impossible d'appeler directement le webhook n8n depuis le frontend
- **Solution** : Création d'une API route `/api/scrape` qui fait proxy

### Organisation des données (Résolu)
- **Problème** : Données brutes difficiles à analyser
- **Solution** : Organisation automatique Call puis Put par date et strike

### Perte des données (Résolu)
- **Problème** : Les données disparaissaient à chaque nouveau scrape
- **Solution** : Système d'onglets avec historique persistant

## 📝 Notes Techniques

- Les colonnes `id`, `createdAt`, `updatedAt` sont automatiquement filtrées de l'affichage
- Le tri et le filtrage fonctionnent en temps réel avec `useMemo`
- Les dates sont converties en timestamps pour le tri et la comparaison
- Le système d'onglets utilise un ID unique basé sur `Date.now()`
- Les filtres sont indépendants pour chaque onglet actif
- L'analyse IA utilise GPT-4 avec un prompt spécialisé en trading d'options
- Les recommandations IA sont affichées en markdown avec react-markdown
- La clé API OpenAI est stockée en variable d'environnement pour la sécurité

## 🤖 Fonctionnement de l'Analyse IA

L'analyse IA fonctionne comme suit :

1. L'utilisateur clique sur "Analyser avec IA"
2. Les données d'options sont envoyées à l'API `/api/analyze`
3. L'API prépare un résumé structuré des données
4. Un prompt détaillé est envoyé à GPT-4o demandant :
   - Vue d'ensemble du marché (3-4 points numérotés)
   - 3-5 options recommandées (avec raisons et niveau de risque 🟢🟡🔴)
   - 3-5 options à éviter (avec raisons et risques identifiés)
   - Recommandations stratégiques (numérotées)
   - Avertissements sur les risques (numérotés)
5. La réponse est formatée en **Markdown** avec espacement optimal
6. `react-markdown` interprète et affiche le Markdown avec style
7. Un avertissement rappelle que ce ne sont pas des conseils financiers

### Détails du Prompt OpenAI

**Message Système :**
```
Tu es un expert en trading d'options et en analyse financière.
Tes analyses sont basées sur les données fournies et tu donnes
des recommandations claires et justifiées.
```

**Prompt Principal :**
Le prompt demande une structure Markdown avec :
- Titres `## ` pour les sections principales (📊 ✅ ❌ 💡 ⚠️)
- Sous-titres `### 🎯` pour chaque option analysée
- Listes **numérotées** (1. 2. 3.) pour les points principaux
- Listes **à puces** (- •) pour les détails de chaque option
- Lignes de séparation `---` entre sections
- **Lignes vides** entre chaque élément pour l'espacement
- Emojis pour visualisation rapide
- Indicateurs de risque : 🟢 Faible / 🟡 Moyen / 🔴 Élevé

**Données envoyées à l'IA :**
Chaque option est résumée avec :
- `type`: Call ou Put
- `date`: Date d'expiration
- `strike`: Strike price
- `bid`: Prix d'achat
- `ask`: Prix de vente
- `volatility`: Volatilité
- `openInterest`: Intérêt ouvert
- `isWeekly`: Weekly ou Standard

**Configuration du modèle :**
- **Modèle** : `gpt-4o` (GPT-4 Optimized)
- **Temperature** : `0.7` (équilibre créativité/cohérence)
- **Max tokens** : `2000` (analyse détaillée)

**Affichage :**
- `react-markdown` avec plugin `remark-gfm`
- Classes Tailwind `prose` pour le style
- Espacement personnalisé : `space-y-2` pour listes, `mt-8` pour titres, `my-8` pour séparateurs
- Scroll automatique si contenu > 800px

---

**Dernière mise à jour** : 2025-10-03
**Status** : 🟢 Version 2.1 - Analyse IA avec Markdown Optimisé
**Version** : 2.1.0

## 🎉 Résumé des fonctionnalités complètes

L'application **Options Viewer** est maintenant complète avec :

✅ **Scraping & Affichage**
- Scraping des données via n8n webhook
- Affichage organisé Call/Put avec couleurs
- 413+ symboles du Montreal Exchange
- Système d'onglets avec historique

✅ **Filtrage & Tri**
- Filtres multiples (Type, Date, Strike, Volatilité, Weekly/Standard)
- Tri par 6 colonnes différentes
- Réinitialisation rapide des filtres

✅ **Export**
- Export CSV avec données filtrées
- Nom de fichier dynamique avec symbole et date

✅ **Analyse IA**
- Analyse automatique par GPT-4o
- Recommandations d'achat/vente personnalisées
- Niveaux de risque visuels (🟢🟡🔴)
- Affichage Markdown élégant et espacé
- Emojis pour navigation rapide
