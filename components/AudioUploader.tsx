'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Trash2, Upload } from 'lucide-react';

interface AudioUploaderProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function AudioUploader({ initialData, isEdit = false }: AudioUploaderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [fileUrl, setFileUrl] = useState(initialData?.audioUrl || '');
  const [transcript, setTranscript] = useState(initialData?.transcript || '');
  const [testId, setTestId] = useState(initialData?.testId?._id || initialData?.testId || '');
  const [order, setOrder] = useState(initialData?.order ?? 1);
  const [tests, setTests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tests')
      .then(res => res.json())
      .then(json => setTests(Array.isArray(json.data) ? json.data : []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/listening/${initialData._id}` : '/api/listening';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        title,
        audioUrl: fileUrl,
        transcript,
        testId: testId || null,
        order,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to save audio module');
      }

      router.push('/dashboard/listening');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">Section Title <span className="text-red-500">*</span></label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="e.g., Section 1 - Conversation at a Housing Office"
            required
          />
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50">
          <div className="mx-auto w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-500">
            <Upload size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">Paste Audio URL Below</h3>
          <p className="text-sm text-slate-500">MP3, WAV, or OGG. Use a hosted link from S3/Cloudinary or any CDN.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Audio File URL <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="https://example.com/audio/section-1.mp3"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Test</label>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Leave Unassigned</option>
              {tests.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Order in Test</label>
            <input
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Transcript <span className="text-slate-400 font-normal">(Optional)</span></label>
          <textarea
            rows={6}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
            placeholder="Paste the full audio transcript here for reference..."
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <X size={18} /> Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !fileUrl.trim()}
            className={`px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 ${(isSubmitting || !title.trim() || !fileUrl.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Audio Module'}
          </button>
        </div>
      </form>
    </div>
  );
}
