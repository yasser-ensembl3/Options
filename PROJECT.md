# Application de Visualisation des Options - Montreal Exchange

## 📋 Vue d'ensemble

Application professionnelle de trading d'options avec interface dark mode, graphiques analytics avancés et connexion PostgreSQL directe. Les données sont récupérées en temps réel depuis une base de données PostgreSQL alimentée par un workflow n8n qui scrape le Montreal Exchange.

### 🆕 Nouveautés Version 3.0
- **Dark Mode Principal** : Interface sombre professionnelle optimisée pour les traders
- **4 Graphiques Interactifs** : Volatility Smile, Volume by Strike, IV Term Structure, Call/Put Ratio
- **Connexion PostgreSQL** : Accès direct à la base de données pour performances optimales
- **Export Multi-Format** : PDF avec graphiques + JSON (vue actuelle et toutes données)
- **Chargement Automatique** : Sélection de symbole = chargement instantané des données

## 🏗️ Architecture

### Flux de données (Version 3.0)
1. **Frontend** : L'utilisateur sélectionne un symbole dans la liste déroulante
2. **Chargement Automatique** : Le frontend appelle `/api/options` avec le symbole
3. **API Route** : Requête SQL sur PostgreSQL pour récupérer les données du symbole
4. **PostgreSQL** : Base de données alimentée en continu par n8n
5. **n8n Background** : Workflow automatisé qui scrape Montreal Exchange toutes les X minutes
6. **Frontend** : Affiche les données + génère 4 graphiques interactifs + crée un onglet

```
[Background] n8n Workflow automatisé
     |
     v
[Montreal Exchange] --scraping--> [PostgreSQL Database]
                                       ^
                                       |
[Frontend] --Sélection symbole--> [Next.js API Route /api/options]
     |                                 |
     |                                 v
     |                      [SQL Query sur PostgreSQL]
     |                                 |
     |<--JSON Response (options)-------+
     |
     v
[Génération Graphiques + Table + Onglet]
     |
     v
[Export PDF/JSON disponible]
```

### Architecture Ancienne (Legacy v2.x)
```
[Frontend] --POST /api/scrape--> [n8n Webhook] --> [Scraping] --> [Response]
```
(Maintenant remplacée par PostgreSQL direct pour meilleures performances)

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

### ✅ Dashboard Dark Mode Professionnel (Mode Principal)
- [x] Interface dark mode comme mode principal de l'application
- [x] 4 graphiques analytiques interactifs (Recharts)
  - Volatility Smile (IV par Strike)
  - Volume par Strike (Top 15 liquidité)
  - IV Term Structure (évolution dans le temps)
  - Call/Put Ratio (sentiment du marché)
- [x] Cartes de statistiques en temps réel
- [x] Layout en grille 2x2 responsive
- [x] Thème sombre professionnel (#0f1419, #1e2329)
- [x] Tooltips détaillés sur tous les graphiques
- [x] Export PDF avec prévisualisation (accessible via `/dark/print-preview`)
- [x] Export JSON (vue actuelle + toutes les données)
- [x] Capture haute qualité des graphiques
- [x] Sélection automatique et chargement des données

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
- **Graphiques** : Recharts (LineChart, BarChart, ComposedChart)
- **Export PDF** : jspdf + html2canvas
- **State Management** : React Hooks (useState, useMemo, useEffect)
- **IA** : OpenAI API (GPT-4)
- **Markdown Rendering** : react-markdown
- **Database** : PostgreSQL (via n8n)

## 📁 Structure du Projet

```
/Options model/
├── app/
│   ├── api/
│   │   ├── options/
│   │   │   ├── route.ts               # API route pour récupération données PostgreSQL
│   │   │   └── export-today/
│   │   │       └── route.ts           # API route pour export toutes données du jour
│   │   ├── scrape/
│   │   │   └── route.ts               # API route proxy vers n8n (legacy)
│   │   └── analyze/
│   │       └── route.ts               # API route pour analyse IA
│   ├── dark/
│   │   └── print-preview/
│   │       └── page.tsx               # Page de prévisualisation PDF
│   ├── layout.tsx                     # Layout Next.js
│   ├── page.tsx                       # Page principale DARK MODE avec graphiques
│   └── globals.css                    # Styles globaux TailwindCSS
├── components/
│   ├── OptionsTable.tsx               # Tableau avec organisation Call/Put (legacy)
│   ├── DataFilters.tsx                # Composant de filtrage et tri (legacy)
│   └── AIAnalysis.tsx                 # Composant d'analyse IA (legacy)
├── .env.example                       # Template pour variables d'environnement
├── .env.local                         # Variables d'environnement (DATABASE_URL)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── PROJECT.md                         # Ce fichier
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

## 🗄️ Configuration PostgreSQL

### Base de Données
- **Source principale** : PostgreSQL via n8n
- **Table** : `options_data` (ou équivalent)
- **Connexion** : Variable d'environnement `DATABASE_URL`
- **ORM** : `@vercel/postgres` pour les requêtes SQL

### API Routes
1. **POST `/api/options`** : Récupère les données d'options pour un symbole donné
   - Paramètre : `symbol` (body)
   - Retourne : Tableau d'options

2. **GET `/api/options/export-today`** : Exporte toutes les données du jour
   - Retourne : Tableau de toutes les options créées aujourd'hui

## 🔗 Configuration n8n (Legacy)

### Webhook URL
- **URL Production** : `http://localhost:5678/webhook/f6645a25-ad42-4d85-92e9-f2301bce649d`
- **Méthode** : GET
- **Paramètres** : `?symbol=SYMBOLE` (ex: `?symbol=BTCQ`)

### Configuration dans n8n
1. Node "Webhook" configuré en mode GET
2. Option "Respond to Webhook" activée
3. Retourne un tableau JSON d'options
4. Le symbole est récupéré via `{{ $request.query.symbol }}`

**Note** : Le webhook n8n est maintenant en mode legacy. Les données sont récupérées directement depuis PostgreSQL pour de meilleures performances.

## 🚀 Installation & Démarrage

```bash
# Installation des dépendances
npm install

# Configuration des variables d'environnement
# 1. Créer un fichier .env.local à la racine du projet
# 2. Ajouter la connexion PostgreSQL :
echo "DATABASE_URL=postgresql://user:password@host:port/database" >> .env.local

# 3. (Optionnel) Ajouter votre clé API OpenAI pour l'analyse IA :
echo "OPENAI_API_KEY=your_api_key_here" >> .env.local

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

1. **Sélectionner un symbole** : Choisissez dans la liste déroulante (50+ symboles populaires)
2. **Chargement automatique** : Les données se chargent automatiquement depuis PostgreSQL
3. **Voir le nom complet** : Le nom de la compagnie s'affiche sous la liste déroulante
4. **Naviguer** : Un nouvel onglet apparaît avec le symbole et l'heure
5. **Analyser les graphiques** : 4 graphiques interactifs affichent la volatilité, volume, term structure et call/put ratio
6. **Filtrer** : Utilisez les 8 filtres (Type, Dates, Strike, Volatilité, Weekly) pour affiner les résultats
7. **Trier** : Cliquez sur les boutons de tri pour organiser les données (Date, Strike, IV, OI, etc.)
8. **Exporter** : Menu d'export avec 3 options
   - Export PDF : Prévisualisation avec graphiques capturés
   - Export Vue Actuelle (JSON) : Données filtrées et triées
   - Export All Data (JSON) : Toutes les options du jour depuis la base de données
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

**Dernière mise à jour** : 2025-10-14
**Status** : 🟢 Version 3.0 - Dark Mode Principal avec Graphiques Professionnels
**Version** : 3.0.0

## 🎉 Résumé des fonctionnalités complètes

L'application **Options Trading Dashboard** est maintenant complète avec :

✅ **Interface Professionnelle Dark Mode**
- Interface dark mode comme mode principal
- Thème sombre optimisé (#0f1419, #1e2329, #252a30)
- Chargement automatique des données depuis PostgreSQL
- 50+ symboles populaires du Montreal Exchange
- Système d'onglets avec historique

✅ **Graphiques Analytics Avancés**
- Volatility Smile (IV par Strike Price)
- Volume par Strike (Top 15 liquidité)
- IV Term Structure (évolution temporelle)
- Call/Put Ratio (sentiment marché)
- Cartes de statistiques en temps réel
- Tooltips interactifs détaillés

✅ **Filtrage & Tri Avancés**
- 8 filtres puissants (Type, Dates Min/Max, Strike Min/Max, Volatilité Min/Max, Weekly)
- Tri dynamique par 6 colonnes (Date, Strike, IV, OI, Bid, Ask)
- Réinitialisation rapide des filtres
- Mise à jour temps réel des graphiques

✅ **Export Multi-Format**
- Export PDF avec prévisualisation et capture haute qualité des graphiques
- Export JSON Vue Actuelle (données filtrées/triées)
- Export JSON All Data (toutes les données du jour depuis DB)
- Menu d'export avec 3 options

✅ **Table de Données Optimisée**
- Organisation intelligente Call/Put par date et strike
- Scroll vertical et horizontal
- Formatage automatique des dates et nombres
- Badges colorés Call (vert) / Put (rouge)
- Affichage compact avec toutes les colonnes
