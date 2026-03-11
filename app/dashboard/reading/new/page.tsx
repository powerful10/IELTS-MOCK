'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewReadingMockPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reading-mocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to create mock');
      router.push(`/dashboard/reading/${json.data._id}/build`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/reading" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Reading Mocks
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">New Reading Mock</h1>
        <p className="text-slate-500 text-sm mt-1">Give your mock a name, then build its passages and questions.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center">
            <BookOpen size={28} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800">Reading Mock</div>
            <div className="text-sm text-slate-500">3 passages · up to 40 questions · IELTS format</div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Mock Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800"
              placeholder="e.g., IELTS Academic Reading Test 1"
              autoFocus
              required
            />
            <p className="text-xs text-slate-400 mt-1.5">You can rename this later from the Reading Mocks list.</p>
          </div>

          <div className="pt-2 flex gap-3">
            <Link
              href="/dashboard/reading"
              className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-center text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create & Build →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
