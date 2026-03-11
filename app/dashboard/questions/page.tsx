'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, FileQuestion } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter !== 'All Types') {
        const typeMap: any = {
          'Multiple Choice': 'multiple_choice',
          'Short Answer': 'short_answer',
          'Matching': 'matching'
        };
        params.append('type', typeMap[typeFilter] || typeFilter);
      }
      
      const response = await fetch(`/api/questions?${params.toString()}`);
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error();
      setQuestions(json.data || []);
    } catch (err) {
      setError('Something went wrong while loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchQuestions();
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, typeFilter, fetchQuestions]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      setIsDeleting(id);
      const response = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete question');
      await fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'short_answer': return 'Short Answer';
      case 'matching': return 'Matching';
      default: return 'Multiple Choice';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Question Bank</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all assessment questions</p>
        </div>
        <Link 
          href="/dashboard/questions/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} className="mr-2" />
          Add Question
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
              placeholder="Search question text..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 sm:flex-none text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option>All Types</option>
              <option>Multiple Choice</option>
              <option>Short Answer</option>
            </select>
          </div>
        </div>

        {loading && questions.length === 0 ? (
           <LoadingSpinner text="Loading questions..." />
        ) : error ? (
           <div className="p-8 text-center text-red-500">{error}</div>
        ) : questions.length === 0 ? (
           <EmptyState 
             title={search || typeFilter !== 'All Types' ? "No questions found" : "No questions created yet"}
             description={search || typeFilter !== 'All Types' ? "Try adjusting your search or filters." : "Start building your question bank."}
             iconType={search || typeFilter !== 'All Types' ? "search" : "question"}
             actionLabel="Add Question"
             actionUrl="/dashboard/questions/new"
           />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4 font-medium">Question Text</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Linked To</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {questions.map((question) => (
                  <tr key={question._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 mt-0.5 shrink-0">
                          <FileQuestion size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 line-clamp-2" dangerouslySetInnerHTML={{ __html: question.questionText }} />
                          <div className="text-xs text-slate-400 mt-1">Answer: {question.correctAnswer}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                        {getTypeLabel(question.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {question.passageId ? (
                         <span className="text-indigo-600 font-medium text-xs">Reading Passage</span>
                      ) : question.listeningId ? (
                         <span className="text-blue-600 font-medium text-xs">Audio Module</span>
                      ) : (
                         <span className="text-slate-400 italic text-xs">Unlinked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/questions/preview/${question._id}`} className="py-2 px-3 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                          Preview
                        </Link>
                         <Link href={`/dashboard/questions/${question._id}/edit`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(question._id)}
                          disabled={isDeleting === question._id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDeleting === question._id ? <LoadingSpinner text="" /> : <Trash2 size={16} />}
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
