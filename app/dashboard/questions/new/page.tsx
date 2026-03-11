import QuestionEditor from '@/components/QuestionEditor';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewQuestionPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/questions" 
          className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Add Question</h1>
          <p className="text-slate-500 text-sm mt-1">Create a new test question and define options</p>
        </div>
      </div>

      <div className="mt-8">
        <QuestionEditor />
      </div>
    </div>
  );
}
