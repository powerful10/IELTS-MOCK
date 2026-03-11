'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PreviewLayout from '@/components/PreviewLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ListeningPreviewPage() {
  const { id } = useParams();
  const [listening, setListening] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListeningData = async () => {
      try {
        const res = await fetch(`/api/listening/${id}`);
        if (!res.ok) throw new Error('Failed to load audio module');
        const data = await res.json();
        setListening(data);

        // Fetch associated questions to show what students will answer
        const qRes = await fetch(`/api/questions?listeningId=${id}`);
        if (qRes.ok) {
           const qData = await qRes.json();
           setQuestions(qData);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchListeningData();
  }, [id]);

  if (loading) return <PreviewLayout title="Loading Preview..." backUrl="/dashboard/listening" typeLabel="Listening Module"><LoadingSpinner /></PreviewLayout>;
  
  if (error) return (
    <PreviewLayout title="Error Loading Preview" backUrl="/dashboard/listening" typeLabel="Listening Module">
      <div className="bg-red-50 text-red-600 p-6 rounded-lg font-medium">{error}</div>
    </PreviewLayout>
  );

  return (
    <PreviewLayout title={listening.testId?.title ? `Audio for: ${listening.testId.title}` : "Unassigned Audio Module"} backUrl="/dashboard/listening" typeLabel="Listening Section">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Audio Player */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl text-center">
          <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-6">Listening Track Playback</h3>
          <audio controls className="w-full mb-2">
            <source src={listening.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <p className="text-slate-400 text-xs mt-4">Students will hear this audio exactly once during the exam.</p>
        </div>

        {/* Associated Questions Preview */}
        <div>
           <div className="border-b border-slate-200 pb-4 mb-6">
             <h2 className="text-xl font-bold text-slate-800">Associated Questions</h2>
             <p className="text-sm text-slate-500 mt-1">These questions will be visible to the student while the audio plays.</p>
           </div>

           {questions.length === 0 ? (
             <div className="bg-amber-50 rounded-lg p-6 border border-amber-200 text-amber-800 text-center">
               <strong className="block mb-1">No questions assigned</strong>
               <p className="text-sm">You haven't linked any questions to this audio module yet.</p>
             </div>
           ) : (
             <div className="space-y-6">
               {questions.map((q, index) => (
                 <div key={q._id} className="bg-white border text-sm border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex gap-4">
                      <div className="bg-slate-100 text-slate-500 w-8 h-8 flex items-center justify-center font-bold rounded-lg shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 mb-4" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                        
                        {q.type === 'multiple_choice' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((opt: string, i: number) => (
                              <div key={i} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50">
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === 'short_answer' && (
                          <div className="w-full max-w-xs h-10 border-b-2 border-slate-300 border-dashed"></div>
                        )}
                      </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </PreviewLayout>
  );
}
