'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Wrench, Eye, Headphones } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

export default function ListeningPage() {
  const [mocks, setMocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchMocks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/listening-mocks');
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error();
      setMocks(json.data || []);
    } catch {
      setError('Failed to load listening mocks. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMocks(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      setIsDeleting(id);
      await fetch(`/api/listening-mocks/${id}`, { method: 'DELETE' });
      await fetchMocks();
    } catch {
      alert('Failed to delete mock.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStatusToggle = async (id: string, current: string) => {
    const newStatus = current === 'draft' ? 'published' : 'draft';
    try {
      await fetch(`/api/listening-mocks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMocks();
    } catch {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Listening Mocks</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage full IELTS Listening tests with 4 parts each</p>
        </div>
        <Link
          href="/dashboard/listening/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} className="mr-2" />
          Create New Listening Mock
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading listening mocks..." />
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>
      ) : mocks.length === 0 ? (
        <EmptyState
          title="No Listening Mocks Yet"
          description="Create your first Listening Mock to build IELTS Listening tests with 4 parts and audio."
          iconType="audio"
          actionLabel="Create First Listening Mock"
          actionUrl="/dashboard/listening/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mocks.map((mock) => {
            const totalQuestions = mock.parts?.reduce((sum: number, p: any) => sum + (p.questions?.length || 0), 0) || 0;
            const partsWithAudio = mock.parts?.filter((p: any) => p.audioUrl?.trim()).length || 0;
            return (
              <div key={mock._id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <Headphones size={20} />
                    </div>
                    <button
                      onClick={() => handleStatusToggle(mock._id, mock.status)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        mock.status === 'published'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mock.status === 'published' ? '● Published' : '○ Draft'}
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{mock.title}</h3>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-400 inline-block"></span>
                      {partsWithAudio}/4 parts with audio
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                      {totalQuestions} questions
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Created {new Date(mock.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/dashboard/listening/${mock._id}/build`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
                  >
                    <Wrench size={14} /> Build
                  </Link>
                  <Link
                    href={`/dashboard/listening/${mock._id}/preview`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                  >
                    <Eye size={14} /> Preview
                  </Link>
                  <Link
                    href={`/dashboard/listening/${mock._id}/edit`}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Rename"
                  >
                    <Edit2 size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(mock._id, mock.title)}
                    disabled={isDeleting === mock._id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {isDeleting === mock._id ? <LoadingSpinner text="" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
