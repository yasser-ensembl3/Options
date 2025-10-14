import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, symbol } = body;

    // Vérifier que la clé API est configurée
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Clé API OpenAI non configurée' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Préparer un résumé des données pour l'IA
    const dataSummary = data.map((row: any) => ({
      type: row.Quotes,
      date: row.Date,
      strike: row.Strike_price,
      bid: row.bid_price,
      ask: row.ask_price,
      volatility: row.volatility,
      openInterest: row.open_interest,
      isWeekly: row.is_weekly === 1 ? 'Weekly' : 'Standard',
    }));

    const prompt = `Tu es un expert en trading d'options. Analyse les données d'options suivantes pour le symbole ${symbol} et donne des recommandations d'investissement claires.

Données des options (${data.length} options) :
${JSON.stringify(dataSummary, null, 2)}

Fournis une analyse détaillée comprenant :

1. **Vue d'ensemble du marché** : Tendances générales observées dans les données

2. **Options recommandées (ACHETER)** : Liste 3-5 options spécifiques avec :
   - Type (Call/Put)
   - Date d'expiration
   - Strike price
   - Raison de la recommandation
   - Niveau de risque (Faible/Moyen/Élevé)

3. **Options à éviter (NE PAS ACHETER)** : Liste 3-5 options avec :
   - Type (Call/Put)
   - Date d'expiration
   - Strike price
   - Raison d'éviter
   - Risques identifiés

4. **Recommandations stratégiques** : Conseils généraux pour ce symbole

5. **Avertissements sur les risques** : Points d'attention importants

Formate ta réponse en MARKDOWN bien structuré et visuellement clair avec BEAUCOUP D'ESPACEMENT.

STRUCTURE REQUISE:

## 📊 Vue d'ensemble du marché

1. Premier point d'analyse
2. Deuxième point d'analyse
3. Troisième point d'analyse

---

## ✅ Options recommandées (ACHETER)

### 🎯 Option 1: [Type] - Strike $[X] - Expiration: [Date]

- **Raison**: [explication détaillée]
- **Niveau de risque**: 🟢 Faible / 🟡 Moyen / 🔴 Élevé

### 🎯 Option 2: [Type] - Strike $[X] - Expiration: [Date]

- **Raison**: [explication détaillée]
- **Niveau de risque**: 🟢 Faible / 🟡 Moyen / 🔴 Élevé

[Répéter pour 3-5 options avec ### pour chaque]

---

## ❌ Options à éviter (NE PAS ACHETER)

### 🎯 Option 1: [Type] - Strike $[X] - Expiration: [Date]

- **Raison**: [explication]
- **Risques identifiés**: [points spécifiques]

### 🎯 Option 2: [Type] - Strike $[X] - Expiration: [Date]

- **Raison**: [explication]
- **Risques identifiés**: [points spécifiques]

[Répéter pour 3-5 options avec ### pour chaque]

---

## 💡 Recommandations stratégiques

1. **Premier conseil stratégique** - Explication
2. **Deuxième conseil stratégique** - Explication
3. **Troisième conseil stratégique** - Explication

---

## ⚠️ Avertissements sur les risques

1. **Premier risque majeur** - Détails
2. **Deuxième risque majeur** - Détails
3. **Troisième risque majeur** - Détails

IMPORTANT:
- Utilise des emojis: 📈 📊 ✅ ❌ ⚠️ 💡 🎯 🟢 🟡 🔴
- Utilise des listes NUMÉROTÉES (1. 2. 3.) pour les points principaux
- Utilise des listes À PUCES (- ) pour les détails sous chaque option
- Ajoute des lignes horizontales (---) entre les sections
- Laisse des LIGNES VIDES entre chaque élément pour l'espacement
- Retourne UNIQUEMENT le Markdown, sans backticks autour`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en trading d\'options et en analyse financière. Tes analyses sont basées sur les données fournies et tu donnes des recommandations claires et justifiées.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysis = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      analysis,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse IA:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de l\'analyse IA'
      },
      { status: 500 }
    );
  }
}
