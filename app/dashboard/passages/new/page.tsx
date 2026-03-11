import PassageEditor from '@/components/PassageEditor';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPassagePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/passages" 
          className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Add Reading Passage</h1>
          <p className="text-slate-500 text-sm mt-1">Create a new text passage for reading sections</p>
        </div>
      </div>

      <div className="mt-8">
        <PassageEditor />
      </div>
    </div>
  );
}
