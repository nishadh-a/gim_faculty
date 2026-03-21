import { useState } from 'react';
import FacultySetup from './components/FacultySetup';
import StudentExam from './components/StudentExam';
import ResultView from './components/ResultView';

function App() {
  const [phase, setPhase] = useState('setup'); // 'setup', 'generating', 'exam', 'analyzing', 'results'
  const [config, setConfig] = useState({
    apiKey: '',
    contextText: '',
    contextFilesBase64: [],
    assignmentFileBase64: null,
    questions: []
  });
  const [answers, setAnswers] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleStartExam = async (setupData) => {
    setConfig(setupData);
    setPhase('generating');

    try {
      const { generateQuestions } = await import('./services/gemini');
      const questions = await generateQuestions(
        setupData.apiKey,
        setupData.contextText,
        setupData.contextFilesBase64,
        setupData.assignmentFileBase64
      );
      
      if (!Array.isArray(questions) || questions.length !== 3) {
        throw new Error("AI did not return exactly 3 questions. Try again.");
      }

      setConfig(prev => ({ ...prev, questions }));
      setPhase('exam');
    } catch (err) {
      console.error(err);
      alert('Error generating questions: ' + err.message);
      setPhase('setup'); // Go back if error
    }
  };

  const handleSubmitExam = async (studentAnswers) => {
    setAnswers(studentAnswers);
    setPhase('analyzing');
    try {
      const { evaluateSubmission } = await import('./services/gemini');
      const result = await evaluateSubmission(config, studentAnswers, config.contextFilesBase64, config.assignmentFileBase64);
      setAnalysisResult(result);
      setPhase('results');
    } catch (err) {
      console.error(err);
      alert('Error analyzing submission: ' + err.message);
      setPhase('exam'); 
    }
  };

  const handleReset = () => {
    setPhase('setup');
    setAnswers({});
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">AI Evaluation Protocol</h1>
          <p className="text-center text-gray-500 mt-2">Sub-Theme 2.3 - Automatic Context-Aware Q&A</p>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        {phase === 'setup' && (
          <FacultySetup initialConfig={config} onStartExam={handleStartExam} />
        )}

        {phase === 'generating' && (
          <div className="flex flex-col items-center justify-center py-20 flex-1">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-6"></div>
            <h2 className="text-2xl font-semibold">Gemini is reading the Context and Assignment...</h2>
            <p className="text-gray-500 mt-2">Generating 3 highly-targeted, AI-resistant questions.</p>
          </div>
        )}
        
        {phase === 'exam' && (
          <StudentExam questions={config.questions} onSubmit={handleSubmitExam} />
        )}

        {phase === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-6"></div>
            <h2 className="text-2xl font-semibold">Gemini is verifying the student's authenticity...</h2>
            <p className="text-gray-500 mt-2">Comparing the live voice answers against the submitted written assignment.</p>
          </div>
        )}

        {phase === 'results' && analysisResult && (
          <ResultView result={analysisResult} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
