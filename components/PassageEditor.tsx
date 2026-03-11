'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';

interface PassageEditorProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PassageEditor({ initialData, isEdit = false }: PassageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [testId, setTestId] = useState(initialData?.testId?._id || initialData?.testId || '');
  const [order, setOrder] = useState(initialData?.order ?? 1);
  const [tests, setTests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tests')
      .then(res => res.json())
      .then(json => setTests(Array.isArray(json.data) ? json.data : []))
      .catch(err => console.error('Error fetching tests', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/passages/${initialData._id}` : '/api/passages';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = { title, content, testId: testId || null, order };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to save passage');
      }

      router.push('/dashboard/passages');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">Passage Title <span className="text-red-500">*</span></label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g., The History of Space Exploration"
              required
            />
          </div>

          <div>
            <label htmlFor="test" className="block text-sm font-medium text-slate-700 mb-2">Assign to Test</label>
            <select
              id="test"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Leave Unassigned</option>
              {tests.map(t => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-slate-700 mb-2">Order in Test</label>
            <input
              id="order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">Passage Content <span className="text-red-500">*</span></label>
            <p className="text-xs text-slate-500 mb-2">Use plain text. Line breaks will be preserved.</p>
            <textarea
              id="content"
              rows={15}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
              placeholder="Paste or write the reading passage content here..."
              required
            />
          </div>
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
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className={`px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 ${(isSubmitting || !title.trim() || !content.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Passage'}
          </button>
        </div>
      </form>
    </div>
  );
}
