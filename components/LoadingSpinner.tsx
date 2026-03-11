import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-24 space-y-4">
      <Loader2 size={32} className="text-indigo-600 animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">{text}</p>
    </div>
  );
}
