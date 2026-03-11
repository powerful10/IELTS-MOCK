'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PreviewLayout from '@/components/PreviewLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TestPreviewPage() {
  const { id } = useParams();
  const [test, setTest] = useState<any>(null);
  const [passages, setPassages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFullTest = async () => {
      try {
        const res = await fetch(`/api/tests/${id}`);
        if (!res.ok) throw new Error('Failed to load test');
        const testData = await res.json();
        setTest(testData);

        // Fetch associated sections (Reading Passages for now)
        const passageRes = await fetch(`/api/passages?testId=${id}`);
        if (passageRes.ok) {
           const pData = await passageRes.json();
           setPassages(pData);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchFullTest();
  }, [id]);

  if (loading) return <PreviewLayout title="Loading Preview..." backUrl="/dashboard/tests" typeLabel="Full Exam"><LoadingSpinner /></PreviewLayout>;
  
  if (error) return (
    <PreviewLayout title="Error Loading Preview" backUrl="/dashboard/tests" typeLabel="Full Exam">
      <div className="bg-red-50 text-red-600 p-6 rounded-lg font-medium">{error}</div>
    </PreviewLayout>
  );

  return (
    <PreviewLayout title={test.title} backUrl="/dashboard/tests" typeLabel="Full Exam Structure">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Exam Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-lg">
          <p className="text-indigo-100 uppercase tracking-widest text-xs font-bold mb-2">IELTS Computer-Based Test Engine</p>
          <h1 className="text-3xl font-bold mb-4">{test.title}</h1>
          <div className="inline-flex items-center justify-center gap-6 text-sm font-medium bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm border border-white/20">
            <span>Reading Sections: {passages.length}</span>
            <div className="w-1 h-1 rounded-full bg-white/50"></div>
            <span>Listening Sections: TBD</span>
          </div>
        </div>

        {/* Structural Map */}
        <div>
           <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Exam Content Structure</h3>
           
           {passages.length === 0 ? (
             <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center text-slate-500">
               No reading passages or listening modules have been attached to this exam yet. <br/> 
               Go to Passages or Listening management to assign content.
             </div>
           ) : (
             <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-md">Reading Component</h4>
                {passages.map((p, index) => (
                  <div key={p._id} className="flex flex-col sm:flex-row gap-6 p-6 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors">
                     <div className="sm:w-1/3">
                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Passage {index + 1}</div>
                        <h5 className="font-bold text-slate-800">{p.title}</h5>
                     </div>
                     <div className="sm:w-2/3">
                       <p className="text-sm text-slate-600 line-clamp-3">
                         {p.text?.replace(/<[^>]*>?/gm, '') || "No text content available."}
                       </p>
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
