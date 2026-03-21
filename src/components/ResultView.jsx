import { AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ResultView({ result, onReset }) {
  let ScoreIcon = HelpCircle;
  let bgClass = "bg-gray-50 border-gray-200";
  let textClass = "text-gray-800";

  switch (result.probability) {
    case 'HIGH':
      ScoreIcon = AlertTriangle;
      bgClass = "bg-red-50 border-red-200";
      textClass = "text-red-800";
      break;
    case 'MEDIUM':
      ScoreIcon = AlertTriangle;
      bgClass = "bg-yellow-50 border-yellow-200";
      textClass = "text-yellow-800";
      break;
    case 'LOW':
      ScoreIcon = ShieldCheck;
      bgClass = "bg-green-50 border-green-200";
      textClass = "text-green-800";
      break;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className={`p-8 rounded-2xl border ${bgClass} shadow-sm flex flex-col items-center justify-center mb-8`}>
        <ScoreIcon size={64} className={`${textClass} mb-4`} />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          AI Detection Probability: {result.probability}
        </h2>
        <p className="text-lg text-gray-600 text-center max-w-2xl px-4">
          Based on the discrepancies in understanding, tone, and logic between the submitted assignment and live answers.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Analysis Context</h3>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{result.reasoning}</p>
      </div>
      
      {result.discrepancies && result.discrepancies.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Key Discrepancies Noted</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
             {result.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-center mt-8 pt-8">
        <button 
          onClick={onReset}
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Reset and Start New Evaluation
        </button>
      </div>
    </div>
  );
}
