'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Trash2 } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', desc: 'Standard 4-option questions' },
  { value: 'true_false_not_given', label: 'True / False / Not Given', desc: 'IELTS reading type' },
  { value: 'matching_headings', label: 'Matching Headings', desc: 'Match paragraphs to headings' },
  { value: 'sentence_completion', label: 'Sentence Completion', desc: 'Fill in the blank' },
];

interface QuestionEditorProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function QuestionEditor({ initialData, isEdit = false }: QuestionEditorProps) {
  const router = useRouter();
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [questionType, setQuestionType] = useState(initialData?.questionType || 'multiple_choice');
  const [options, setOptions] = useState<string[]>(initialData?.options?.length ? initialData.options : ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correctAnswer || '');
  const [explanation, setExplanation] = useState(initialData?.explanation || '');
  const [passageId, setPassageId] = useState(initialData?.passageId?._id || initialData?.passageId || '');
  const [listeningId, setListeningId] = useState(initialData?.listeningId?._id || initialData?.listeningId || '');
  const [passages, setPassages] = useState<any[]>([]);
  const [listenings, setListenings] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/passages').then(r => r.json()).then(j => setPassages(Array.isArray(j.data) ? j.data : [])).catch(console.error);
    fetch('/api/listening').then(r => r.json()).then(j => setListenings(Array.isArray(j.data) ? j.data : [])).catch(console.error);
  }, []);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctAnswer === options[index]) setCorrectAnswer('');
  };

  const showOptions = questionType === 'multiple_choice' || questionType === 'true_false_not_given';
  const showTextAnswer = questionType === 'sentence_completion' || questionType === 'matching_headings';

  // For true/false/not given, always use fixed options
  const tfngOptions = ['True', 'False', 'Not Given'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (questionType === 'multiple_choice' && !options.includes(correctAnswer)) {
      setError('Select a correct answer from the options by clicking the radio button.');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = isEdit ? `/api/questions/${initialData._id}` : '/api/questions';
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = {
        questionText,
        questionType,
        correctAnswer,
        explanation,
        passageId: passageId || null,
        listeningId: listeningId || null,
      };

      if (questionType === 'multiple_choice') {
        payload.options = options.filter(o => o.trim() !== '');
      } else if (questionType === 'true_false_not_given') {
        payload.options = tfngOptions;
      } else {
        payload.options = [];
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to save question');
      }

      router.push('/dashboard/questions');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Question Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUESTION_TYPES.map(qt => (
              <label
                key={qt.value}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${questionType === qt.value ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <input type="radio" name="qtype" className="sr-only" checked={questionType === qt.value} onChange={() => { setQuestionType(qt.value); setCorrectAnswer(''); }} />
                <div className="font-semibold text-slate-800 text-sm">{qt.label}</div>
                <p className="text-xs text-slate-500 mt-1">{qt.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Question Text <span className="text-red-500">*</span></label>
          <textarea
            rows={4}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="e.g., What is the main idea of paragraph 2?"
            required
          />
        </div>

        {/* Multiple Choice Options */}
        {questionType === 'multiple_choice' && (
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Answer Options</h3>
              <button type="button" onClick={addOption} className="text-xs text-indigo-600 font-medium flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                <Plus size={14} className="mr-1" /> Add Option
              </button>
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input type="radio" name="correct_answer" checked={correctAnswer === opt && opt !== ''} onChange={() => setCorrectAnswer(opt)} className="w-5 h-5 text-indigo-600 cursor-pointer" title="Mark as correct" />
                  <span className="font-bold text-slate-400 w-6 text-center">{String.fromCharCode(65 + idx)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => { handleOptionChange(idx, e.target.value); if (correctAnswer === opt) setCorrectAnswer(e.target.value); }}
                    className="flex-1 px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder={`Option ${idx + 1}`}
                    required
                  />
                  <button type="button" onClick={() => removeOption(idx)} disabled={options.length <= 2} className="p-2 text-slate-400 hover:text-red-500 rounded disabled:opacity-30">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Click the radio button to mark the correct answer.</p>
          </div>
        )}

        {/* True/False/Not Given */}
        {questionType === 'true_false_not_given' && (
          <div className="pb-6 border-b border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
            <div className="flex gap-3">
              {tfngOptions.map(opt => (
                <label key={opt} className={`flex-1 border rounded-lg p-3 text-center cursor-pointer transition-all ${correctAnswer === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 hover:border-indigo-300 text-slate-700'}`}>
                  <input type="radio" name="tfng" className="sr-only" checked={correctAnswer === opt} onChange={() => setCorrectAnswer(opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Text Answer (sentence completion / matching headings) */}
        {showTextAnswer && (
          <div className="pb-6 border-b border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full max-w-sm px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder={questionType === 'matching_headings' ? 'e.g., Heading B' : 'e.g., industrial revolution'}
              required
            />
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Explanation <span className="text-slate-400 font-normal">(Optional)</span></label>
          <textarea
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            placeholder="Why is this the correct answer? This helps with student review."
          />
        </div>

        {/* Link to Passage / Listening */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Link to Reading Passage</label>
            <select value={passageId} onChange={(e) => { setPassageId(e.target.value); setListeningId(''); }} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">None</option>
              {passages.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">OR Link to Audio Module</label>
            <select value={listeningId} onChange={(e) => { setListeningId(e.target.value); setPassageId(''); }} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">None</option>
              {listenings.map(l => <option key={l._id} value={l._id}>{l.title || l.audioUrl}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <X size={18} /> Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !questionText.trim() || !correctAnswer.trim()}
            className={`px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 ${(isSubmitting || !questionText.trim() || !correctAnswer.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
