import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PreviewLayoutProps {
  title: string;
  backUrl: string;
  typeLabel: string;
  children: React.ReactNode;
}

export default function PreviewLayout({ title, backUrl, typeLabel, children }: PreviewLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simulation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link 
            href={backUrl} 
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Exit Preview"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-0.5 block">{typeLabel} Preview</span>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">{title}</h1>
          </div>
        </div>
        <div className="flex items-center">
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 shadow-sm">
            Student View Simulation
          </span>
        </div>
      </header>

      {/* Simulation Content Area */}
      <main className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden my-4 min-h-[600px]">
          {/* Simulated Browser Bar (Aesthetic) */}
           <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </div>
          <div className="p-8 md:p-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
