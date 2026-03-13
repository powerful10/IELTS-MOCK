'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  X,
  Eye,
  Save,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { parseIeltstext, ParsedMock, ParsedSection, QuestionData } from '@/lib/ieltsParser';
import { createWorker } from 'tesseract.js';
// PDF logic will be dynamically imported to avoid SSR/DOMMatrix errors

export default function PdfBuilderPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedMock, setParsedMock] = useState<ParsedMock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [testType, setTestType] = useState<'reading' | 'listening'>('reading');
  const [saving, setSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [timerActive, setTimerActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setShowResults(true);
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // Dynamic import to avoid DOMMatrix error during evaluation
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }
    
    if (!fullText.trim()) {
      return performOcr(pdf);
    }
    
    return fullText;
  };

  const performOcr = async (pdf: any): Promise<string> => {
    setOcrStatus('Initializing OCR Engine...');
    const worker = await createWorker('eng');
    let fullText = '';

    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        setOcrStatus(`OCR: Processing Page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;
        
        const imageData = canvas.toDataURL('image/png');
        const { data: { text } } = await worker.recognize(imageData);
        fullText += text + '\n';
      }
    } finally {
      await worker.terminate();
      setOcrStatus(null);
    }

    if (!fullText.trim()) {
       throw new Error('OCR failed to extract any text. The PDF might be too blurry or encrypted.');
    }

    return fullText;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const text = await extractTextFromPdf(file);
      const parsed = parseIeltstext(text, testType);
      setParsedMock(parsed);
      // Reset timer when new test is analyzed
      setTimeLeft(3600);
      setTimerActive(false);
    } catch (err: any) {
      console.error(err);
      setError('Failed to extract text from PDF. Please try a different file.');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateQuestion = (sectionIdx: number, qIdx: number, updated: Partial<QuestionData>) => {
    if (!parsedMock) return;
    const sections = [...parsedMock.sections];
    sections[sectionIdx].questions[qIdx] = { ...sections[sectionIdx].questions[qIdx], ...updated };
    setParsedMock({ ...parsedMock, sections });
  };

  const handleSave = async () => {
    if (!parsedMock) return;
    setSaving(true);
    try {
      // First upload PDF to persistent storage
      const formData = new FormData();
      formData.append('file', file!);
      const uploadRes = await fetch('/api/upload/pdf', { method: 'POST', body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) throw new Error('PDF upload failed');

      // Create the mock record
      const endpoint = testType === 'reading' ? '/api/reading-mocks' : '/api/listening-mocks';
      const body = testType === 'reading' 
        ? {
            title: parsedMock.title,
            pdfUrl: uploadJson.url,
            passages: parsedMock.sections.map((s, i) => ({
              passageNumber: (i + 1) as 1|2|3,
              title: s.title,
              content: s.content,
              questions: s.questions
            }))
          }
        : {
            title: parsedMock.title,
            pdfUrl: uploadJson.url,
            parts: parsedMock.sections.map((s, i) => ({
              partNumber: (i + 1) as 1|2|3|4,
              transcript: s.content,
              questions: s.questions,
              audioUrl: '' // Manual entry required later
            }))
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Save failed');

      router.push(`/dashboard/${testType}/${json.data._id}/build`);
    } catch (err: any) {
      setError(err.message || 'Failed to save test.');
    } finally {
      setSaving(false);
    }
  };

  if (analyzing) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <LoadingSpinner text={ocrStatus || "AI is analyzing your PDF... Identifying sections and questions..."} />
      {ocrStatus && (
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">
          {ocrStatus}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Sparkles className="text-indigo-600" /> PDF AI Test Builder
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Upload an IELTS PDF and let AI build the computer-based version for you.</p>
          </div>
        </div>
      </div>

      {!parsedMock ? (
        /* Upload View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-12 flex flex-col items-center text-center">
            {/* Test Type Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8 w-full max-w-sm">
              <button 
                onClick={() => setTestType('reading')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${testType === 'reading' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Reading Exam
              </button>
              <button 
                onClick={() => setTestType('listening')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${testType === 'listening' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Listening Exam
              </button>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-16 transition-all cursor-pointer ${
                file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 animate-in zoom-in-50">
                    <FileText size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{file.name}</p>
                    <p className="text-slate-500 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB · PDF Document</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-lg">Click to select or drag & drop</p>
                    <p className="text-slate-400 text-sm mt-1">Upload the clear IELTS Reading or Listening PDF source</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100 text-sm font-medium">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file}
              className="mt-10 flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all scale-100 active:scale-95 group"
            >
              Start AI Analysis <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        /* Review View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Draft Test: <span className="text-indigo-600">{parsedMock.title}</span></h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setIsPreviewing(!isPreviewing);
                  if (!isPreviewing) setTimerActive(true);
                  else setTimerActive(false);
                }}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
                  isPreviewing ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isPreviewing ? <ArrowLeft size={18} /> : <Eye size={18} />}
                {isPreviewing ? 'Back to Editor' : 'Live Student Preview'}
              </button>
              {!isPreviewing && (
                <button 
                  onClick={() => setParsedMock(null)}
                  className="px-4 py-2 text-slate-500 font-bold hover:text-slate-800"
                >
                  Discard
                </button>
              )}
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                disabled={saving}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Finalize & Create Test'}
              </button>
            </div>
          </div>

          {isPreviewing ? (
            <div className="bg-[#f0f2f5] rounded-3xl border border-slate-300 overflow-hidden h-[800px] flex flex-col animate-in fade-in zoom-in-95 duration-500 shadow-2xl relative">
               <div className="bg-[#2c3e50] text-white px-8 py-4 flex items-center justify-between z-20 shadow-md">
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">IELTS Computer Based</span>
                      <h3 className="font-bold text-lg">{parsedMock.title}</h3>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-600 hidden md:block" />
                    <div className="flex items-center gap-2">
                       {parsedMock.sections.map((_, idx) => (
                         <button 
                           key={idx}
                           onClick={() => setActiveTab(idx)}
                           className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                             activeTab === idx ? 'bg-white text-[#2c3e50]' : 'text-slate-300 hover:text-white'
                           }`}
                         >
                           {testType === 'reading' ? `Reading Passage ${idx + 1}` : `Listening Part ${idx + 1}`}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-3 px-6 py-2 rounded-xl border-2 transition-all ${
                      timeLeft < 300 ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-[#34495e] border-slate-600'
                    }`}>
                       <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter">Time Left</span>
                       <span className="text-2xl font-black font-mono w-20 text-center">{formatTime(timeLeft)}</span>
                    </div>

                    {!showResults ? (
                      <button 
                         onClick={() => { setShowResults(true); setTimerActive(false); }}
                         className="px-8 py-2.5 bg-[#27ae60] hover:bg-[#2ecc71] text-white rounded-xl font-black text-sm transition-all shadow-lg"
                      >
                        Finish Test
                      </button>
                    ) : (
                      <button 
                         onClick={() => { 
                           setShowResults(false); 
                           setStudentAnswers({}); 
                           setTimeLeft(3600);
                           setTimerActive(true);
                         }}
                         className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black text-sm transition-all shadow-lg"
                      >
                        Reset Attempt
                      </button>
                    )}
                 </div>
               </div>

               {showResults && (
                 <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-top duration-500">
                    <div className="bg-white border-4 border-emerald-500 shadow-2xl rounded-2xl p-6 flex items-center gap-8">
                       <div className="bg-emerald-500 text-white p-4 rounded-xl">
                          <CheckCircle size={32} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Test Complete</p>
                          <h4 className="text-3xl font-black text-slate-900">
                            SCORE: {
                              Object.entries(studentAnswers).filter(([key, val]) => {
                                const [sIdx, qIdx] = key.split('_').map(Number);
                                return val.trim().toLowerCase() === parsedMock.sections[sIdx].questions[qIdx].correctAnswer.trim().toLowerCase();
                              }).length
                            } / {parsedMock.sections.reduce((acc, s) => acc + s.questions.length, 0)}
                          </h4>
                       </div>
                       <button onClick={() => setShowResults(false)} className="text-slate-400 hover:text-slate-600 p-2">
                         <X size={20} />
                       </button>
                    </div>
                 </div>
               )}

               <div className="flex flex-1 overflow-hidden">
                 <div className="w-1/2 overflow-y-auto p-12 bg-white scroll-smooth border-r border-slate-200">
                    <div className="max-w-2xl mx-auto">
                      <h2 className="text-4xl font-black text-slate-900 mb-8 border-b-4 border-indigo-600 pb-4 inline-block">{parsedMock.sections[activeTab].title}</h2>
                      <div className="prose prose-slate max-w-none text-slate-800 leading-[1.8] text-lg font-serif space-y-8">
                         {parsedMock.sections[activeTab].content.split('\n').filter(l => l.trim()).map((p, i) => (
                           <p key={i} className="mb-6">{p}</p>
                         ))}
                      </div>
                    </div>
                 </div>
                 
                 <div className="w-1/2 overflow-y-auto p-12 bg-[#f8fafc] scroll-smooth shadow-inner">
                    <div className="max-w-lg mx-auto space-y-10">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest border-l-8 border-amber-400 pl-4">Questions {
                          parsedMock.sections[activeTab].questions.length > 0
                            ? `${parsedMock.sections[activeTab].questions[0].order} – ${parsedMock.sections[activeTab].questions[parsedMock.sections[activeTab].questions.length-1].order}`
                            : ''
                        }</h3>
                      </div>

                      {parsedMock.sections[activeTab].questions.map((q, qIdx) => {
                        const key = `${activeTab}_${qIdx}`;
                        const userAnswer = studentAnswers[key] || '';
                        const isCorrect = showResults && userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                  const isWrong = showResults && userAnswer && !isCorrect;

                        return (
                          <div key={qIdx} className={`bg-white p-8 rounded-3xl border-2 transition-all ${
                            showResults 
                              ? isCorrect ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100' : isWrong ? 'border-red-400 bg-red-50 shadow-lg shadow-red-100' : 'border-slate-100'
                              : 'border-white shadow-xl hover:shadow-2xl hover:scale-[1.01]'
                          }`}>
                            <div className="flex items-start gap-4 mb-6">
                              <span className="bg-[#2c3e50] text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg">
                                {q.order}
                              </span>
                              <div className="flex-1 pt-1">
                                 {q.questionType === 'sentence_completion' ? (
                                   <div className="text-slate-800 leading-relaxed font-medium">
                                      {q.questionText.split(/(____+|\.\.\.\.+)/).map((part, pi) => (
                                        part.match(/(____+|\.\.\.\.+)/) ? (
                                          <input 
                                            key={pi}
                                            type="text"
                                            value={userAnswer}
                                            disabled={showResults}
                                            onChange={(e) => setStudentAnswers({ ...studentAnswers, [key]: e.target.value })}
                                            className={`inline-block mx-1 w-40 border-b-4 focus:border-indigo-600 bg-slate-50 px-4 py-1 text-base font-bold outline-none transition-all text-center rounded-t-lg ${
                                              showResults ? isCorrect ? 'border-emerald-500 text-emerald-700 bg-emerald-100' : 'border-red-500 text-red-700 bg-red-100' : 'border-slate-300'
                                            }`}
                                            placeholder="..."
                                          />
                                        ) : <span key={pi}>{part}</span>
                                      ))}
                                   </div>
                                 ) : (
                                   <p className="text-slate-800 font-bold text-lg leading-tight">{q.questionText}</p>
                                 )}
                              </div>
                            </div>

                            {q.questionType === 'multiple_choice' && q.options && (
                              <div className="space-y-3 ml-14">
                                {q.options.map((opt, oi) => (
                                  <label key={oi} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all group ${
                                    userAnswer === opt 
                                      ? showResults 
                                        ? isCorrect ? 'border-emerald-500 bg-emerald-100 text-emerald-900' : 'border-red-500 bg-red-100 text-red-900'
                                        : 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md'
                                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                  }`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all ${
                                      userAnswer === opt ? 'bg-current border-transparent text-white' : 'border-slate-300 text-slate-400 group-hover:border-indigo-400'
                                    }`}>
                                      {String.fromCharCode(65 + oi)}
                                    </div>
                                    <input 
                                      type="radio" 
                                      name={`q-${key}`} 
                                      checked={userAnswer === opt}
                                      disabled={showResults}
                                      onChange={() => setStudentAnswers({ ...studentAnswers, [key]: opt })}
                                      className="hidden" 
                                    />
                                    <span className="text-sm font-bold">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {q.questionType === 'true_false_not_given' && (
                              <div className="grid grid-cols-3 gap-3 ml-14">
                                {['True', 'False', 'Not Given'].map(opt => (
                                  <button 
                                    key={opt} 
                                    onClick={() => setStudentAnswers({ ...studentAnswers, [key]: opt })}
                                    disabled={showResults}
                                    className={`py-3 text-[10px] font-black border-2 rounded-2xl transition-all uppercase tracking-tighter ${
                                      userAnswer === opt
                                        ? showResults
                                          ? isCorrect ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-600 text-white border-red-600'
                                          : 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105'
                                        : 'border-slate-100 text-slate-500 hover:border-indigo-200'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {showResults && !isCorrect && (
                              <div className="mt-6 pt-6 border-t border-slate-100 text-xs flex items-center gap-3">
                                 <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase text-[10px]">Reference Answer</div>
                                 <span className="font-black text-emerald-600 text-base">{q.correctAnswer}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="py-20 text-center opacity-20">
                         <FileText size={48} className="mx-auto" />
                         <p className="mt-4 font-black uppercase tracking-[1em]">End of Questions</p>
                      </div>
                   </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              <div className="lg:col-span-1 space-y-4">
                {parsedMock.sections.map((section, sIdx) => (
                  <div key={sIdx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-2">{section.title}</h3>
                    <div className="text-xs text-slate-500 mb-4 line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      {section.content}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold uppercase text-[10px]">
                        {section.questions.length} Questions
                      </span>
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 space-y-4">
                {parsedMock.sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <h3 className="font-bold text-indigo-900">{section.title} – Detailed Review</h3>
                    </div>
                    {section.questions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Question {q.order}</span>
                            <input 
                              type="text" 
                              className="w-full text-lg font-bold text-slate-800 border-none p-0 focus:ring-0" 
                              value={q.questionText}
                              onChange={(e) => updateQuestion(sIdx, qIdx, { questionText: e.target.value })}
                            />
                          </div>
                          <select 
                            className="text-xs font-bold bg-slate-100 border-none rounded-lg focus:ring-0"
                            value={q.questionType}
                            onChange={(e) => updateQuestion(sIdx, qIdx, { questionType: e.target.value as any })}
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false_not_given">T/F/NG</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>
                        
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                                <span className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded-full font-bold text-[10px]">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <input 
                                  className="flex-1 bg-transparent border-none text-slate-700 p-0 focus:ring-0"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...(q.options || [])];
                                    opts[oIdx] = e.target.value;
                                    updateQuestion(sIdx, qIdx, { options: opts });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Set Correct Answer</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                            placeholder="Type the correct answer (e.g. APPLE / TRUE / A)"
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(sIdx, qIdx, { correctAnswer: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
