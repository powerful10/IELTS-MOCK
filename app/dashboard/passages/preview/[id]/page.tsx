'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PreviewLayout from '@/components/PreviewLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PassagePreviewPage() {
  const { id } = useParams();
  const [passage, setPassage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPassage = async () => {
      try {
        const res = await fetch(`/api/passages/${id}`);
        if (!res.ok) throw new Error('Failed to load passage for preview');
        const data = await res.json();
        setPassage(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPassage();
  }, [id]);

  if (loading) return <PreviewLayout title="Loading Preview..." backUrl="/dashboard/passages" typeLabel="Reading Passage"><LoadingSpinner /></PreviewLayout>;
  
  if (error) return (
    <PreviewLayout title="Error Loading Preview" backUrl="/dashboard/passages" typeLabel="Reading Passage">
      <div className="bg-red-50 text-red-600 p-6 rounded-lg font-medium">{error}</div>
    </PreviewLayout>
  );

  return (
    <PreviewLayout title={passage.title} backUrl="/dashboard/passages" typeLabel="Reading Passage">
      <div className="prose prose-slate max-w-none">
        <h1 className="text-2xl font-bold mb-6 text-center">{passage.title}</h1>
        <div 
          className="text-slate-800 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: passage.text?.replace(/\n/g, '<br/>') || 'No content available.' }} 
        />
      </div>
    </PreviewLayout>
  );
}
