'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PreviewLayout from '@/components/PreviewLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function QuestionPreviewPage() {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`/api/questions/${id}`);
        if (!res.ok) throw new Error('Failed to load question for preview');
        const data = await res.json();
        setQuestion(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuestion();
  }, [id]);

  if (loading) return <PreviewLayout title="Loading Preview..." backUrl="/dashboard/questions" typeLabel="Question"><LoadingSpinner /></PreviewLayout>;
  
  if (error) return (
    <PreviewLayout title="Error Loading Preview" backUrl="/dashboard/questions" typeLabel="Question">
      <div className="bg-red-50 text-red-600 p-6 rounded-lg font-medium">{error}</div>
    </PreviewLayout>
  );

  return (
    <PreviewLayout title="Interactive Question Preview" backUrl="/dashboard/questions" typeLabel={`Question (${question.type.replace('_', ' ')})`}>
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Question Text */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
           <div className="flex gap-4">
             <div className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center font-bold rounded-full shrink-0">
               1
             </div>
             <div className="prose prose-slate max-w-none pt-1" dangerouslySetInnerHTML={{ __html: question.questionText }} />
           </div>
        </div>

        {/* Input Interactive Area */}
        <div className="px-12">
          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((opt: string, idx: number) => {
                const char = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === opt;
                const isCorrect = question.correctAnswer === opt;
                
                return (
                  <label 
                    key={idx} 
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50 shadow-[0_0_0_1px_rgba(79,70,229,1)]' 
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors ${
                      isSelected ? 'border-none bg-indigo-600' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold text-slate-700">{char}.</span>
                      <span className="text-slate-800">{opt}</span>
                    </div>

                    {/* Admin highlight for correct answer visually */}
                    {isCorrect && (
                       <div className="ml-auto text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                         Correct Answer
                       </div>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'short_answer' && (
            <div className="space-y-4">
              <input 
                type="text" 
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full xl max-w-sm px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
              />
              <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-200 inline-block">
                <span className="font-semibold text-slate-700">Admin Note - Acceptable Answer: </span>
                {question.correctAnswer}
              </div>
            </div>
          )}
        </div>
      </div>
    </PreviewLayout>
  );
}
