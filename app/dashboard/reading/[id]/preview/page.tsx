'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Wrench, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

// Standard IELTS Reading band score table
function getBandScore(correct: number, total: number): string {
  if (total === 0) return 'N/A';
  // Normalize to 40 questions
  const normalized = Math.round((correct / total) * 40);
  if (normalized >= 39) return '9.0';
  if (normalized >= 37) return '8.5';
  if (normalized >= 35) return '8.0';
  if (normalized >= 33) return '7.5';
  if (normalized >= 30) return '7.0';
  if (normalized >= 27) return '6.5';
  if (normalized >= 23) return '6.0';
  if (normalized >= 19) return '5.5';
  if (normalized >= 15) return '5.0';
  if (normalized >= 13) return '4.5';
  if (normalized >= 10) return '4.0';
  return '< 4.0';
}

function getBandColor(band: string): string {
  const num = parseFloat(band);
  if (num >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (num >= 7) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (num >= 6) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
  if (num >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export default function ReadingPreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [mock, setMock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // answers: { [passageIdx_questionIdx]: string }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activePassage, setActivePassage] = useState(0);

  const fetchMock = useCallback(async () => {
    try {
      const res = await fetch(`/api/reading-mocks/${id}`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error();
      const data = json.data;
      const passages = [1, 2, 3].map((n) => {
        const found = data.passages?.find((p: any) => p.passageNumber === n);
        return found || { passageNumber: n, title: '', content: '', questions: [] };
      });
      setMock({ ...data, passages });
    } catch {
      setError('Failed to load preview.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMock(); }, [fetchMock]);

  const setAnswer = (key: string, val: string) => setAnswers(prev => ({ ...prev, [key]: val }));

  const calcScore = () => {
    let correct = 0;
    let total = 0;
    mock.passages.forEach((p: any, pi: number) => {
      p.questions.forEach((q: any, qi: number) => {
        total++;
        const key = `${pi}_${qi}`;
        const ans = (answers[key] || '').trim().toLowerCase();
        const correct_ans = (q.correctAnswer || '').trim().toLowerCase();
        if (ans === correct_ans) correct++;
      });
    });
    return { correct, total };
  };

  if (loading) return <LoadingSpinner text="Loading preview..." />;
  if (error || !mock) return <div className="p-6 bg-red-50 text-red-600 rounded-xl">{error || 'Not found'}</div>;

  const { correct, total } = submitted ? calcScore() : { correct: 0, total: 0 };
  const band = submitted ? getBandScore(correct, total) : '';
  const bandColor = submitted ? getBandColor(band) : '';
  const passage = mock.passages[activePassage];

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = mock.passages.reduce((s: number, p: any) => s + (p.questions?.length || 0), 0);

  return (
    <div className="flex flex-col h-full -m-8">
      {/* Preview Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/reading/${id}/build`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-bold text-slate-800">{mock.title}</h1>
            <p className="text-xs text-slate-500">Student Preview Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/reading/${id}/build`} className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <Wrench size={16} /> Back to Builder
          </Link>
          {!submitted && (
            <button
              onClick={() => setSubmitted(true)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Submit Answers
            </button>
          )}
        </div>
      </div>

      {/* Results Banner */}
      {submitted && (
        <div className={`mx-6 mt-4 p-5 rounded-xl border-2 flex flex-col sm:flex-row items-center gap-6 ${bandColor}`}>
          <div className="text-center sm:text-left flex-1">
            <div className="text-lg font-bold">Test Complete! 🎉</div>
            <div className="text-sm mt-0.5 opacity-80">
              You answered {correct} out of {total} questions correctly ({Math.round((correct / Math.max(total, 1)) * 100)}%)
            </div>
          </div>
          <div className={`text-center px-8 py-4 rounded-xl border ${bandColor}`}>
            <div className="text-4xl font-black">{band}</div>
            <div className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-70">IELTS Band</div>
          </div>
          <button
            onClick={() => { setAnswers({}); setSubmitted(false); }}
            className="px-5 py-2 bg-white bg-opacity-70 rounded-lg text-sm font-semibold border border-current hover:bg-opacity-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden mt-4">
        {/* Passage Tab Sidebar */}
        <div className="w-48 bg-slate-50 border-r border-slate-200 flex flex-col p-4 gap-2 shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Passages</p>
          {mock.passages.map((p: any, idx: number) => {
            const pQCount = p.questions?.length || 0;
            const pAnswered = p.questions?.filter((_: any, qi: number) => answers[`${idx}_${qi}`]).length || 0;
            return (
              <button
                key={idx}
                onClick={() => setActivePassage(idx)}
                className={`flex flex-col text-left px-4 py-3 rounded-xl border transition-all ${
                  activePassage === idx
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <span className="font-bold text-sm">Passage {idx + 1}</span>
                <span className={`text-xs mt-0.5 ${activePassage === idx ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {pAnswered}/{pQCount} answered
                </span>
              </button>
            );
          })}
          <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 px-2">
              <div className="flex justify-between"><span>Total answered</span> <span className="font-bold">{answeredCount}/{totalQuestions}</span></div>
            </div>
          </div>
        </div>

        {/* Main Preview Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Passage Content (PDF or Text) */}
          <div className="flex-1 overflow-hidden bg-white border-r border-slate-200 flex flex-col">
            {mock.pdfUrl ? (
              <div className="flex-1 w-full h-full bg-slate-100 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> PDF SOURCE PREVIEW
                  </span>
                  <a 
                    href={mock.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] bg-white px-2 py-1 rounded border border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    OPEN FULL PDF
                  </a>
                </div>
                <iframe 
                  src={mock.pdfUrl} 
                  className="flex-1 w-full border-none"
                  title={`Passage ${activePassage + 1} PDF`}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Passage {activePassage + 1}</h2>
                {passage.title && <h3 className="text-lg font-semibold text-slate-600 mb-6">{passage.title}</h3>}
                {passage.content ? (
                  <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-[15px] font-serif space-y-4">
                    {passage.content.split('\n').filter((l: string) => l.trim()).map((para: string, i: number) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">No passage text added yet.</div>
                )}
              </div>
            )}
          </div>

          {/* Questions Panel */}
          <div className="w-80 xl:w-96 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-4 shrink-0">
            <h3 className="font-bold text-slate-800">Questions – Passage {activePassage + 1}</h3>
            {(passage.questions || []).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No questions for this passage.</div>
            ) : (
              passage.questions.map((q: any, qi: number) => {
                const key = `${activePassage}_${qi}`;
                const userAnswer = answers[key] || '';
                const isCorrect = submitted && userAnswer.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
                const isWrong = submitted && userAnswer && !isCorrect;
                const isMissed = submitted && !userAnswer;

                return (
                  <div
                    key={qi}
                    className={`bg-white rounded-xl border p-4 transition-all ${
                      submitted
                        ? isCorrect ? 'border-green-300 bg-green-50' : isWrong ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <span className="font-bold text-slate-400 text-sm shrink-0">Q{qi + 1}.</span>
                      <p className="text-sm text-slate-700 font-medium">{q.questionText}</p>
                    </div>

                    {/* Answer inputs based on type */}
                    {q.questionType === 'multiple_choice' && q.options.length > 0 && (
                      <div className="space-y-2">
                        {q.options.map((opt: string, oi: number) => (
                          <label key={oi} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            userAnswer === opt
                              ? submitted
                                ? isCorrect ? 'border-green-400 bg-green-100' : 'border-red-400 bg-red-100'
                                : 'border-indigo-500 bg-indigo-50'
                              : submitted && opt === q.correctAnswer
                                ? 'border-green-400 bg-green-100'
                                : 'border-slate-200 hover:border-indigo-300'
                          }`}>
                            <input
                              type="radio"
                              name={`q-${key}`}
                              value={opt}
                              checked={userAnswer === opt}
                              disabled={submitted}
                              onChange={() => setAnswer(key, opt)}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.questionType === 'true_false_not_given' && (
                      <div className="flex gap-2">
                        {['True', 'False', 'Not Given'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            disabled={submitted}
                            onClick={() => setAnswer(key, opt)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              userAnswer === opt
                                ? submitted
                                  ? isCorrect ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                                  : 'bg-indigo-600 text-white border-indigo-600'
                                : submitted && opt === q.correctAnswer
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {['matching_headings', 'matching_information', 'sentence_completion', 'summary_completion', 'short_answer'].includes(q.questionType) && (
                      <input
                        type="text"
                        value={userAnswer}
                        disabled={submitted}
                        onChange={(e) => setAnswer(key, e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          submitted
                            ? isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                            : 'border-slate-300'
                        }`}
                        placeholder="Type your answer..."
                      />
                    )}

                    {/* Result feedback */}
                    {submitted && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                          {isCorrect ? <CheckCircle size={13} /> : <XCircle size={13} />}
                          {isCorrect ? 'Correct!' : `Correct answer: ${q.correctAnswer}`}
                        </div>
                        {q.explanation && (
                          <p className="text-xs text-slate-500 mt-1">{q.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {!submitted && (passage.questions || []).length > 0 && (
              <button
                onClick={() => setSubmitted(true)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors mt-2"
              >
                Submit All Answers
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
