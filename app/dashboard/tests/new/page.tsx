import TestForm from '@/components/TestForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTestPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/tests" 
          className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create New Test</h1>
          <p className="text-slate-500 text-sm mt-1">Configure basic details for standard IELTS test</p>
        </div>
      </div>

      <div className="mt-8">
        <TestForm />
      </div>
    </div>
  );
}
