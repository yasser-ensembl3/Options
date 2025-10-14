'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIAnalysisProps {
  data: any[];
  symbol: string;
}

export const AIAnalysis = ({ data, symbol }: AIAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          symbol,
        }),
      });

      // Vérifier que la réponse est OK
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Lire le texte brut d'abord pour debugger
      const text = await response.text();
      console.log('Réponse brute:', text.substring(0, 200));

      // Parser le JSON
      const result = JSON.parse(text);

      if (result.success) {
        // Nettoyer le Markdown si GPT-4 a ajouté des backticks
        let cleanedMarkdown = result.analysis || '';

        // Enlever les backticks markdown si présents
        cleanedMarkdown = cleanedMarkdown.replace(/```markdown\n?/g, '');
        cleanedMarkdown = cleanedMarkdown.replace(/```\n?/g, '');

        // Enlever les espaces au début et à la fin
        cleanedMarkdown = cleanedMarkdown.trim();

        setAnalysis(cleanedMarkdown);
        setShowAnalysis(true);
      } else {
        setError(result.error || 'Erreur lors de l\'analyse');
      }
    } catch (err: any) {
      console.error('Erreur complète:', err);
      setError(err.message || 'Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Analyse IA avec OpenAI
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Obtenez des recommandations d'investissement basées sur les données
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyse en cours...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyser avec IA
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {showAnalysis && analysis && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Recommandations IA</h3>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg overflow-auto max-h-[800px]">
            <div className="prose prose-sm max-w-none
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:first:mt-0
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6
              [&_ul]:space-y-2 [&_ul]:mb-6
              [&_ol]:space-y-2 [&_ol]:mb-6
              [&_li]:text-gray-700
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_hr]:my-8 [&_hr]:border-gray-300
              [&_strong]:text-gray-900 [&_strong]:font-semibold">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysis}
              </ReactMarkdown>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Avertissement :</strong> Ces recommandations sont générées par IA et sont à titre informatif uniquement.
              Elles ne constituent pas des conseils financiers. Faites toujours vos propres recherches et consultez un conseiller financier avant d'investir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
