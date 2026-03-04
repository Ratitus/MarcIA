import { useState } from 'react';
import { Languages, ArrowRightLeft, Loader2, Copy, Check } from 'lucide-react';
import { translateText } from '../services/geminiService';

const LANGUAGES = [
  { code: 'ca', name: 'Català' },
  { code: 'es', name: 'Castellà' },
  { code: 'en', name: 'Anglès' },
  { code: 'fr', name: 'Francès' },
  { code: 'de', name: 'Alemany' },
  { code: 'it', name: 'Italià' },
  { code: 'pt', name: 'Portuguès' },
  { code: 'ja', name: 'Japonès' },
  { code: 'zh', name: 'Xinès' },
  { code: 'ru', name: 'Rus' },
  { code: 'ar', name: 'Àrab' },
];

export default function TranslatorView() {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('ca');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    try {
      const from = LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
      const to = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      const result = await translateText(sourceText, from, to);
      setTargetText(result);
    } catch (error) {
      console.error(error);
      setTargetText('Error en la traducció.');
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  const copyToClipboard = () => {
    if (!targetText) return;
    navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-8 overflow-y-auto bg-white dark:bg-zinc-950">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
            <Languages className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Traductor Universal</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Tradueix textos per al teu joc a múltiples idiomes (Català 100% suportat).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* Source */}
          <div className="flex flex-col space-y-2">
            <select 
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 focus:outline-none focus:border-emerald-500 shadow-sm"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Escriu el text a traduir..."
              className="w-full h-64 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none shadow-sm"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center py-2 md:py-0">
            <button 
              onClick={swapLanguages}
              className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full transition-colors shadow-sm"
            >
              <ArrowRightLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Target */}
          <div className="flex flex-col space-y-2">
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl p-3 focus:outline-none focus:border-emerald-500 shadow-sm"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            <div className="relative w-full h-64">
              <textarea
                readOnly
                value={targetText}
                placeholder="La traducció apareixerà aquí..."
                className="w-full h-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-zinc-800 dark:text-emerald-50 focus:outline-none resize-none shadow-sm"
              />
              {targetText && (
                <button
                  onClick={copyToClipboard}
                  className="absolute bottom-4 right-4 p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors flex items-center shadow-md border border-zinc-200 dark:border-zinc-700"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim()}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center text-lg shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Traduint...
              </>
            ) : (
              'Traduir Text'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
