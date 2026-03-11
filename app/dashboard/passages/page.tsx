'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, FileText } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PassagesPage() {
  const [passages, setPassages] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [testFilter, setTestFilter] = useState('Filter by Test');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchPassages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (testFilter !== 'Filter by Test') params.append('testId', testFilter);
      
      const response = await fetch(`/api/passages?${params.toString()}`);
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error();
      setPassages(json.data || []);
    } catch (err) {
      setError('Something went wrong while loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [search, testFilter]);

  useEffect(() => {
    // Also fetch tests for the filter dropdown
    fetch('/api/tests')
      .then(res => res.json())
      .then(json => setTests(Array.isArray(json.data) ? json.data : []))
      .catch(err => console.error('Error fetching tests for filter', err));
  }, []);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPassages();
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, testFilter, fetchPassages]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passage?')) return;
    
    try {
      setIsDeleting(id);
      const response = await fetch(`/api/passages/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete passage');
      await fetchPassages();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reading Passages</h1>
          <p className="text-slate-500 text-sm mt-1">Manage texts and articles used in reading sections</p>
        </div>
        <Link 
          href="/dashboard/passages/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} className="mr-2" />
          Add Passage
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-sm flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search passage titles..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="flex-1 sm:flex-none text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option>Filter by Test</option>
              {tests.map(t => (
                 <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && passages.length === 0 ? (
           <LoadingSpinner text="Loading passages..." />
        ) : error ? (
           <div className="p-8 text-center text-red-500">{error}</div>
        ) : passages.length === 0 ? (
           <EmptyState 
             title={search || testFilter !== 'Filter by Test' ? "No passages found" : "No passages created yet"}
             description={search || testFilter !== 'Filter by Test' ? "Try adjusting your search or filters." : "Start writing your first reading passage."}
             iconType={search || testFilter !== 'Filter by Test' ? "search" : "passage"}
             actionLabel="Add Passage"
             actionUrl="/dashboard/passages/new"
           />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4 font-medium">Passage Title</th>
                  <th className="px-6 py-4 font-medium">Assigned Test</th>
                  <th className="px-6 py-4 font-medium">Word Count</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {passages.map((passage) => (
                  <tr key={passage._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="font-medium text-slate-800">{passage.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {passage.testId ? (
                        <Link href={`/dashboard/tests/`} className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200">
                          {passage.testId.title}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {passage.text ? passage.text.split(/\s+/).length : 0} words
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/passages/preview/${passage._id}`} className="py-2 px-3 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                          Preview
                        </Link>
                         <Link href={`/dashboard/passages/${passage._id}/edit`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(passage._id)}
                          disabled={isDeleting === passage._id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDeleting === passage._id ? <LoadingSpinner text="" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
