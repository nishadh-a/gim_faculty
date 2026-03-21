import { useState, useRef, useEffect } from 'react';
import { Mic, Square, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';

function Timer({ timeLeft }) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return (
    <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg shadow-sm
      ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-white text-gray-800 border'}`}>
      <Clock size={24} />
      {minutes < 10 ? '0' : ''}{minutes}:{seconds < 10 ? '0' : ''}{seconds}
    </div>
  );
}

function QuestionCard({ question, value, onChange, isActive }) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          onChange(value + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [value, onChange]);

  // Clean up recording if unmounted or un-actived
  useEffect(() => {
    if (!isActive && isRecording && recognitionRef.current) {
       recognitionRef.current.stop();
       setIsRecording(false);
    }
  }, [isActive, isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return alert('Speech recognition not supported in this browser.');
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-100 mb-6">
       <span className="text-indigo-600 font-semibold mb-2 block">Question</span>
      <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-relaxed">{question.text}</h3>
      
      <div className="flex flex-col gap-3">
        <textarea
          readOnly
          value={value}
          className="w-full h-48 border border-gray-200 bg-gray-50 rounded-xl p-4 text-gray-800 text-lg cursor-not-allowed"
          placeholder="Answers must be provided via Voice. Click the microphone to begin..."
        />
        
        <div className="flex justify-between items-center bg-gray-50 rounded-lg pt-2 mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleRecording}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-full text-white font-bold transition shadow-sm
                ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}
              `}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop Recording' : 'Start Voice Answer (2 mins max recommended)'}
            </button>
            {isRecording && <span className="text-red-500 font-semibold flex items-center gap-1"><AlertCircle size={18}/> Listening... Speak clearly.</span>}
          </div>
          <span className="text-sm text-gray-500 flex items-center gap-1">
             {value.length > 0 && <><CheckCircle size={18} className="text-green-500"/> Transcribed</>}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StudentExam({ questions, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes * 60 seconds

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      onSubmit(answers);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onSubmit, answers]);

  const handleAnswerChange = (qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit(answers); // Finished all questions
    }
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="max-w-4xl mx-auto py-4 h-full flex flex-col pt-[5vh]">
      
      <div className="flex justify-between items-center mb-6 px-2">
         <div className="flex gap-2">
            {questions.map((q, idx) => (
              <div 
                key={q.id} 
                className={`w-12 h-2 rounded-full ${idx === currentIndex ? 'bg-indigo-600' : idx < currentIndex ? 'bg-indigo-300' : 'bg-gray-200'}`} 
              />
            ))}
         </div>
         <Timer timeLeft={timeLeft} />
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl mb-6 shadow-sm">
         <p className="text-blue-800 font-medium">
            You have a strict 10-minute time limit for the entire evaluation. Typing is disabled; answers must be provided using your voice.
         </p>
      </div>

      {questions.map((q, idx) => (
        <QuestionCard 
          key={q.id} 
          isActive={idx === currentIndex}
          question={q} 
          value={answers[q.id] || ''} 
          onChange={(val) => handleAnswerChange(q.id, val)} 
        />
      ))}

      <div className="flex justify-between items-center mt-6">
        <span className="text-gray-500 font-medium">
            Question {currentIndex + 1} of {questions.length}
        </span>
        <button
          onClick={handleNext}
          className={`flex items-center gap-2 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition text-lg
            ${isLastQuestion ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-900'}
          `}
        >
          {isLastQuestion ? 'Submit Final Evaluation' : 'Lock Answer & Next Question'}
          {!isLastQuestion && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
}
