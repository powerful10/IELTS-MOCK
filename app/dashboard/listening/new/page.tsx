'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, ArrowLeft, Upload, FileJson, FileText, Download, Target } from 'lucide-react';
import Link from 'next/link';

export default function NewListeningMockPage() {
  const router = useRouter();
  
  // Manual Creation State
  const [title, setTitle] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Bulk Upload State
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmittingManual(true);
    setManualError(null);
    try {
      const res = await fetch('/api/listening-mocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to create mock');
      router.push(`/dashboard/listening/${json.data._id}/build`);
    } catch (err: any) {
      setManualError(err.message);
      setIsSubmittingManual(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsSubmittingImport(true);
    setImportError(null);
    
    try {
      const text = await file.text();
      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch (err) {
        throw new Error('Invalid JSON format. Please use the provided template.');
      }

      const res = await fetch('/api/listening-mocks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });
      
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to import mock');
      
      // Success! Go heavily straight to the builder
      router.push(`/dashboard/listening/${json.data._id}/build`);
    } catch (err: any) {
      setImportError(err.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsSubmittingImport(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/listening" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Listening Mocks
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Create Listening Mock</h1>
        <p className="text-slate-500 text-sm mt-1">Choose how you want to create your new mock exam.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Option 1: Import from JSON */}
        <div className="bg-white rounded-xl border-2 border-slate-200 border-dashed shadow-sm p-8 flex flex-col hover:border-teal-400 transition-colors bg-slate-50">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Upload size={24} className="text-teal-700" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-lg">Instant Import</div>
              <div className="text-sm text-slate-500">Upload a filled template</div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6 flex-1">
            Instantly create a full 4-part Mock Test with all 40 questions by uploading our standard JSON template.
          </p>

          <a 
            href="/ielts_listening_template.json" 
            download
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-4 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-sm"
          >
            <Download size={16} /> Download Template
          </a>

          {importError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200">{importError}</div>}

          <input 
            type="file" 
            accept="application/json,.json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmittingImport}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileJson size={18} /> {isSubmittingImport ? 'Importing Exam...' : 'Upload JSON File'}
          </button>
        </div>

        {/* Option 2: Build Manually */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-indigo-600" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-lg">Build Manually</div>
              <div className="text-sm text-slate-500">Start from absolute scratch</div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-8 flex-1">
            Give your mock a name, then manually set up audio parts and add questions one by one using the interactive builder.
          </p>

          {manualError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200">{manualError}</div>}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                Mock Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                placeholder="e.g., General Training Test A"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingManual || !title.trim()}
              className="w-full py-3 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingManual ? 'Creating...' : 'Create & Open Builder →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
