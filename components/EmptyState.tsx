import { FileQuestion, AlertCircle, FileText, Headphones, Users, SearchX } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  iconType?: 'test' | 'passage' | 'question' | 'audio' | 'user' | 'search';
}

export default function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  actionUrl,
  iconType = 'test' 
}: EmptyStateProps) {
  
  const getIcon = () => {
    switch(iconType) {
      case 'passage': return <FileText size={48} className="text-slate-300" />;
      case 'question': return <FileQuestion size={48} className="text-slate-300" />;
      case 'audio': return <Headphones size={48} className="text-slate-300" />;
      case 'user': return <Users size={48} className="text-slate-300" />;
      case 'search': return <SearchX size={48} className="text-slate-300" />;
      default: return <AlertCircle size={48} className="text-slate-300" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
      <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
        {getIcon()}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-8">{description}</p>
      
      {actionLabel && actionUrl && (
        <Link 
          href={actionUrl}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
