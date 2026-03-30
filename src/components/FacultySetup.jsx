import { useState } from 'react';
import { Key, BookOpen, FileText, Upload } from 'lucide-react';
import { fileToBase64 } from '../utils/fileHelpers';

export default function FacultySetup({ initialConfig, onStartExam }) {
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);
  const [contextText, setContextText] = useState(initialConfig.contextText);
  const [contextFiles, setContextFiles] = useState([]);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!apiKey) return alert('Please provide a Gemini API Key to proceed.');
    if (!contextText.trim() && contextFiles.length === 0) return alert('Please provide some Context (text or PDF).');
    if (!assignmentFile) return alert('Please upload the Student Assignment PDF.');
    
    setIsLoading(true);
    
    try {
      const assignmentFileBase64 = await fileToBase64(assignmentFile);
      const contextFilesBase64 = await Promise.all(Array.from(contextFiles).map(fileToBase64));

      onStartExam({
        apiKey,
        contextText,
        contextFilesBase64,
        assignmentFileBase64
      });
    } catch (e) {
      console.error(e);
      alert("Error reading files: " + e.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Key className="text-indigo-600" />
          System Configuration
        </h2>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Gemini API Key</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </div>

      <hr />

      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <BookOpen className="text-indigo-600" />
          Evaluation Context (Syllabus, Specs, Rubrics)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Context Text (Optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500"
              placeholder="Paste specific context..."
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 flex items-center gap-2">
              <Upload size={16}/> Context PDFs (Required if no text)
            </label>
             <div className="border border-dashed border-gray-400 rounded-lg p-6 bg-gray-50 flex items-center justify-center h-32">
                <input 
                  type="file" 
                  multiple 
                  accept="application/pdf"
                  onChange={(e) => setContextFiles(e.target.files)} 
                  className="w-full text-gray-600"
                />
             </div>
             {contextFiles.length > 0 && <span className="text-sm text-green-600 font-semibold">{contextFiles.length} file(s) selected</span>}
          </div>
        </div>
      </div>

      <hr />

      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <FileText className="text-indigo-600" />
          Student's Submitted Assignment
        </h2>
        <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 flex items-center gap-2">
               <Upload size={16}/> Assignment PDF (Mandatory)
            </label>
            <div className="border border-dashed border-gray-400 rounded-lg p-6 bg-gray-50 flex items-center justify-center h-24">
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={(e) => setAssignmentFile(e.target.files[0])} 
                  className="w-full text-gray-600"
                />
             </div>
             {assignmentFile && <span className="text-sm text-green-600 font-semibold">1 file selected: {assignmentFile.name}</span>}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isLoading ? "Reading Files..." : "Generate AI-Resistant Question & Start Exam"}
        </button>
      </div>
    </div>
  );
}
