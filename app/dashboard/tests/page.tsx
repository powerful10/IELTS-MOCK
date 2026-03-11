'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, Filter, BookOpen } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'All Status') params.append('status', statusFilter);
      
      const response = await fetch(`/api/tests?${params.toString()}`);
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error();
      setTests(json.data || []);
    } catch (err) {
      setError('Something went wrong while loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Use a ref to debounce search
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchTests();
    }, 300); // 300ms debounce
    
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, statusFilter, fetchTests]);


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test? All associated passages and questions may become orphaned.')) return;
    
    try {
      setIsDeleting(id);
      const response = await fetch(`/api/tests/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete test');
      await fetchTests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };


  const handleStatusToggle = async (testId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      fetchTests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Test Management</h1>
          <p className="text-slate-500 text-sm mt-1">Create, edit, and organize IELTS tests</p>
        </div>
        <Link 
          href="/dashboard/tests/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} className="mr-2" />
          Create New Test
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-sm flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search tests by title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option>All Status</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading && tests.length === 0 ? (
           <LoadingSpinner text="Loading tests..." />
        ) : error ? (
           <div className="p-8 text-center text-red-500">{error}</div>
        ) : tests.length === 0 ? (
           <EmptyState 
             title={search || statusFilter !== 'All Status' ? "No tests found" : "No tests created yet"}
             description={search || statusFilter !== 'All Status' ? "Try adjusting your search or filters to find what you are looking for." : "Start building your first test by clicking the button above."}
             iconType={search || statusFilter !== 'All Status' ? "search" : "test"}
           />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4 font-medium">Test Name</th>
                  <th className="px-6 py-4 font-medium">Author</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {tests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
                          <BookOpen size={16} />
                        </div>
                        <span className="font-medium text-slate-800">{test.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-slate-600">{test.createdBy?.name || 'Unknown Admin'}</span>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => handleStatusToggle(test._id, test.status)}
                         className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          test.status === 'published' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${test.status === 'published' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                          {test.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(test.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/tests/preview/${test._id}`} className="py-2 px-3 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                          Preview
                        </Link>
                         <Link href={`/dashboard/tests/${test._id}/edit`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(test._id)}
                          disabled={isDeleting === test._id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDeleting === test._id ? <LoadingSpinner text="" /> : <Trash2 size={16} />}
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
