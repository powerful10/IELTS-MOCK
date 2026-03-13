'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Save, Eye, ArrowLeft, CheckCircle, AlertCircle, FileJson, FileText, Upload, X } from 'lucide-react';
import InlineQuestionEditor, { QuestionData } from '@/components/InlineQuestionEditor';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Passage {
  _id?: string;
  passageNumber: 1 | 2 | 3;
  title: string;
  pdfUrl?: string;
  content: string;
  questions: QuestionData[];
}

interface ReadingMock {
  _id: string;
  title: string;
  status: string;
  pdfUrl: string;
  passages: Passage[];
}

const defaultQuestion = (order: number): QuestionData => ({
  questionText: '',
  questionType: 'multiple_choice',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
  order,
});

export default function ReadingBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [mock, setMock] = useState<ReadingMock | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [activePassage, setActivePassage] = useState<0 | 1 | 2>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const fetchMock = useCallback(async () => {
    try {
      const res = await fetch(`/api/reading-mocks/${id}`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error();
      // Ensure passages array always has 3 entries
      const data = json.data;
      const passages: Passage[] = [1, 2, 3].map(n => {
        const found = data.passages?.find((p: any) => p.passageNumber === n);
        return found || { passageNumber: n as 1|2|3, title: '', content: '', questions: [] };
      });
      setMock({ ...data, passages });
    } catch {
      setError('Failed to load reading mock.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMock(); }, [fetchMock]);

  const updatePassage = (idx: number, updated: Partial<Passage>) => {
    if (!mock) return;
    const passages = mock.passages.map((p, i) => i === idx ? { ...p, ...updated } : p);
    setMock({ ...mock, passages });
  };

  const addQuestion = (passageIdx: number) => {
    if (!mock) return;
    const passage = mock.passages[passageIdx];
    const newQ = defaultQuestion(passage.questions.length + 1);
    updatePassage(passageIdx, { questions: [...passage.questions, newQ] });
  };

  const updateQuestion = (passageIdx: number, qIdx: number, updated: QuestionData) => {
    if (!mock) return;
    const passage = mock.passages[passageIdx];
    const questions = passage.questions.map((q, i) => i === qIdx ? updated : q);
    updatePassage(passageIdx, { questions });
  };

  const deleteQuestion = (passageIdx: number, qIdx: number) => {
    if (!mock) return;
    const passage = mock.passages[passageIdx];
    const questions = passage.questions.filter((_, i) => i !== qIdx);
    updatePassage(passageIdx, { questions });
  };

  const handleSave = async () => {
    if (!mock) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/reading-mocks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passages: mock.passages, title: mock.title, pdfUrl: mock.pdfUrl }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };


  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/pdf', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Upload failed');
      if (mock) setMock({ ...mock, pdfUrl: json.url });
    } catch (err: any) {
      setError(err.message || 'PDF upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading builder..." />;
  if (error || !mock) return <div className="p-6 bg-red-50 text-red-600 rounded-xl">{error || 'Mock not found'}</div>;

  const passage = mock.passages[activePassage];
  const totalQuestions = mock.passages.reduce((sum, p) => sum + p.questions.length, 0);

  return (
    <div className="flex flex-col h-full -m-8">
      {/* Builder Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/reading" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 text-lg truncate">{mock.title}</h1>
            <p className="text-xs text-slate-500">{totalQuestions} questions across 3 passages</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle size={16} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
              <AlertCircle size={16} /> Save failed
            </span>
          )}
          <Link
            href={`/dashboard/reading/${id}/preview`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Eye size={16} /> Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Mock'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Passage Select */}
        <div className="w-56 bg-slate-50 border-r border-slate-200 flex flex-col p-4 space-y-2 shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Passages</p>
          {[0, 1, 2].map((idx) => {
            const p = mock.passages[idx];
            const qCount = p.questions.length;
            const hasContent = !!p.content?.trim();
            return (
              <button
                key={idx}
                onClick={() => setActivePassage(idx as 0 | 1 | 2)}
                className={`flex flex-col text-left px-4 py-3 rounded-xl border transition-all ${
                  activePassage === idx
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <span className="font-bold text-sm">Passage {idx + 1}</span>
                <span className={`text-xs mt-0.5 ${activePassage === idx ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {qCount} question{qCount !== 1 ? 's' : ''} · {hasContent ? '✓ text added' : '○ empty'}
                </span>
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 space-y-1 px-2">
              <div className="flex justify-between">
                <span>Total questions</span>
                <span className="font-bold text-slate-700">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span>Target</span>
                <span className="font-bold text-slate-700">40</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Builder Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Passage Text Editor */}
            <div className="lg:w-1/2 p-6 border-r border-slate-200 flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Passage {activePassage + 1} Title
                  </label>
                  <input
                    type="text"
                    value={passage.title}
                    onChange={(e) => updatePassage(activePassage, { title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g., The History of Urban Agriculture"
                  />
                </div>

              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Passage Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="flex-1 min-h-[500px] px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-serif leading-relaxed resize-none transition-all"
                  value={passage.content}
                  onChange={(e) => updatePassage(activePassage, { content: e.target.value })}
                  placeholder="Paste the reading passage text here. Use proper paragraphing for best student experience..."
                />
                <p className="text-xs text-slate-400 mt-2">{passage.content.length} characters · {passage.content.split('\n').filter(l => l.trim()).length} paragraphs</p>
              </div>
            </div>

            {/* Questions Panel */}
            <div className="lg:w-1/2 p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">Questions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{passage.questions.length} question{passage.questions.length !== 1 ? 's' : ''} for Passage {activePassage + 1}</p>
                </div>
                <button
                  onClick={() => addQuestion(activePassage)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  <Plus size={15} /> Add Question
                </button>
              </div>

              {passage.questions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Plus size={24} className="text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-600 mb-1">No Questions Yet</h3>
                  <p className="text-sm text-slate-400 max-w-xs">Click "Add Question" to start adding IELTS questions for this passage.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {passage.questions.map((q, qIdx) => (
                    <InlineQuestionEditor
                      key={qIdx}
                      question={q}
                      index={qIdx}
                      onChange={(updated) => updateQuestion(activePassage, qIdx, updated)}
                      onDelete={() => deleteQuestion(activePassage, qIdx)}
                    />
                  ))}
                  <button
                    onClick={() => addQuestion(activePassage)}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    + Add Another Question
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
