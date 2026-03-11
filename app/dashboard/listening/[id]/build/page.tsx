'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Save, Eye, ArrowLeft, CheckCircle, AlertCircle, Music, Upload, Link2, X, FileAudio } from 'lucide-react';
import InlineQuestionEditor, { QuestionData } from '@/components/InlineQuestionEditor';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Part {
  _id?: string;
  partNumber: 1 | 2 | 3 | 4;
  audioUrl: string;
  transcript: string;
  questions: QuestionData[];
}

interface ListeningMock {
  _id: string;
  title: string;
  status: string;
  parts: Part[];
}

const defaultQuestion = (order: number): QuestionData => ({
  questionText: '',
  questionType: 'multiple_choice',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
  order,
});

export default function ListeningBuilderPage() {
  const params = useParams();
  const id = params.id as string;

  const [mock, setMock] = useState<ListeningMock | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [activePart, setActivePart] = useState<0 | 1 | 2 | 3>(0);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [audioTab, setAudioTab] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fetchMock = useCallback(async () => {
    try {
      const res = await fetch(`/api/listening-mocks/${id}`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error();
      const data = json.data;
      const parts: Part[] = [1, 2, 3, 4].map(n => {
        const found = data.parts?.find((p: any) => p.partNumber === n);
        return found || { partNumber: n as 1|2|3|4, audioUrl: '', transcript: '', questions: [] };
      });
      setMock({ ...data, parts });
    } catch {
      setError('Failed to load listening mock.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMock(); }, [fetchMock]);

  const updatePart = (idx: number, updated: Partial<Part>) => {
    if (!mock) return;
    const parts = mock.parts.map((p, i) => i === idx ? { ...p, ...updated } : p);
    setMock({ ...mock, parts });
  };

  const addQuestion = (partIdx: number) => {
    if (!mock) return;
    const part = mock.parts[partIdx];
    const newQ = defaultQuestion(part.questions.length + 1);
    updatePart(partIdx, { questions: [...part.questions, newQ] });
  };

  const updateQuestion = (partIdx: number, qIdx: number, updated: QuestionData) => {
    if (!mock) return;
    const part = mock.parts[partIdx];
    const questions = part.questions.map((q, i) => i === qIdx ? updated : q);
    updatePart(partIdx, { questions });
  };

  const deleteQuestion = (partIdx: number, qIdx: number) => {
    if (!mock) return;
    const part = mock.parts[partIdx];
    const questions = part.questions.filter((_, i) => i !== qIdx);
    updatePart(partIdx, { questions });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Upload failed');
      updatePart(activePart, { audioUrl: json.url });
      setUploadedFileName(file.name);
      setAudioError(false);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSave = async () => {
    if (!mock) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/listening-mocks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: mock.parts, title: mock.title }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading builder..." />;
  if (error || !mock) return <div className="p-6 bg-red-50 text-red-600 rounded-xl">{error || 'Mock not found'}</div>;

  const part = mock.parts[activePart];
  const totalQuestions = mock.parts.reduce((sum, p) => sum + p.questions.length, 0);

  return (
    <div className="flex flex-col h-full -m-8">
      {/* Builder Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/listening" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 text-lg truncate">{mock.title}</h1>
            <p className="text-xs text-slate-500">{totalQuestions} questions across 4 parts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle size={16} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
              <AlertCircle size={16} /> Save failed
            </span>
          )}
          <Link
            href={`/dashboard/listening/${id}/preview`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Eye size={16} /> Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Mock'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Part Select */}
        <div className="w-56 bg-slate-50 border-r border-slate-200 flex flex-col p-4 space-y-2 shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Parts</p>
          {[0, 1, 2, 3].map((idx) => {
            const p = mock.parts[idx];
            const qCount = p.questions.length;
            const hasAudio = !!p.audioUrl?.trim();
            return (
              <button
                key={idx}
                onClick={() => { setActivePart(idx as 0|1|2|3); setAudioError(false); }}
                className={`flex flex-col text-left px-4 py-3 rounded-xl border transition-all ${
                  activePart === idx
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                <span className="font-bold text-sm">Part {idx + 1}</span>
                <span className={`text-xs mt-0.5 ${activePart === idx ? 'text-teal-200' : 'text-slate-400'}`}>
                  {qCount} q{qCount !== 1 ? 's' : ''} · {hasAudio ? '🔊 audio set' : '○ no audio'}
                </span>
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 space-y-1 px-2">
              <div className="flex justify-between">
                <span>Total questions</span>
                <span className="font-bold text-slate-700">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span>Target</span>
                <span className="font-bold text-slate-700">40</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Builder Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Audio + Settings  */}
          <div className="lg:w-1/2 p-6 border-r border-slate-200 flex flex-col gap-4 overflow-y-auto">
            <div>
              <h2 className="font-bold text-slate-800 mb-1">Part {activePart + 1} – Audio</h2>
              <p className="text-xs text-slate-500">Add an audio file by uploading from your device or by pasting a URL.</p>
            </div>

            {/* Audio Source Tabs */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
              <button
                type="button"
                onClick={() => setAudioTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  audioTab === 'upload' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload size={15} /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setAudioTab('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  audioTab === 'url' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Link2 size={15} /> Paste URL
              </button>
            </div>

            {/* Upload Tab */}
            {audioTab === 'upload' && (
              <div className="space-y-3">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4,.mp3,.wav,.ogg,.aac,.m4a"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />

                {/* Drag & Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50'
                      : uploading
                        ? 'border-teal-300 bg-teal-50/50 cursor-wait'
                        : 'border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/30'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
                      <p className="text-sm font-semibold text-teal-700">Uploading audio...</p>
                    </div>
                  ) : (
                    <>
                      <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        isDragging ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Upload size={24} />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">Drag & drop your audio file here</p>
                      <p className="text-xs text-slate-400 mt-1">or <span className="text-teal-600 font-semibold underline">click to browse</span></p>
                      <p className="text-xs text-slate-400 mt-2">MP3, WAV, OGG, AAC · Max 50 MB</p>
                    </>
                  )}
                </div>

                {/* Upload Error */}
                {uploadError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                    <X size={14} className="shrink-0 mt-0.5" />
                    {uploadError}
                  </div>
                )}

                {/* Uploaded file indicator */}
                {uploadedFileName && part.audioUrl?.startsWith('/uploads/') && (
                  <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <FileAudio size={16} className="text-teal-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-teal-700 truncate">{uploadedFileName}</p>
                      <p className="text-xs text-teal-500 truncate">{part.audioUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updatePart(activePart, { audioUrl: '' }); setUploadedFileName(null); }}
                      className="p-1 text-teal-400 hover:text-red-500 transition-colors shrink-0"
                      title="Remove audio"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* URL Tab */}
            {audioTab === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Audio File URL</label>
                  <input
                    type="text"
                    value={part.audioUrl?.startsWith('/uploads/') ? '' : part.audioUrl}
                    onChange={(e) => { updatePart(activePart, { audioUrl: e.target.value }); setAudioError(false); setUploadedFileName(null); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="https://example.com/audio/part1.mp3"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Paste a direct link to an MP3, WAV, or OGG file from any CDN or hosting service.</p>
                </div>
              </div>
            )}

            {/* Audio Player Preview */}
            {part.audioUrl?.trim() && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Music size={14} className="text-teal-600" />
                  <span className="text-xs font-semibold text-slate-600">Audio Preview</span>
                </div>
                {audioError ? (
                  <div className="text-xs text-red-500 p-3 bg-red-50 rounded-lg">Cannot load audio. Check this is a valid, directly accessible audio file.</div>
                ) : (
                  <audio key={part.audioUrl} controls className="w-full" onError={() => setAudioError(true)}>
                    <source src={part.audioUrl} />
                    Your browser does not support audio playback.
                  </audio>
                )}
              </div>
            )}

            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Transcript <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <textarea
                className="w-full min-h-[240px] px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono resize-none transition-all"
                value={part.transcript}
                onChange={(e) => updatePart(activePart, { transcript: e.target.value })}
                placeholder="Paste the transcript for this part (used for admin reference)..."
              />
            </div>
          </div>

          {/* Right: Questions */}
          <div className="lg:w-1/2 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Questions</h2>
                <p className="text-xs text-slate-500 mt-0.5">{part.questions.length} question{part.questions.length !== 1 ? 's' : ''} for Part {activePart + 1}</p>
              </div>
              <button
                onClick={() => addQuestion(activePart)}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-semibold hover:bg-teal-100 transition-colors border border-teal-200"
              >
                <Plus size={15} /> Add Question
              </button>
            </div>

            {part.questions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Plus size={24} className="text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-600 mb-1">No Questions Yet</h3>
                <p className="text-sm text-slate-400 max-w-xs">Click "Add Question" to add listening questions for this part.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {part.questions.map((q, qIdx) => (
                  <InlineQuestionEditor
                    key={qIdx}
                    question={q}
                    index={qIdx}
                    onChange={(updated) => updateQuestion(activePart, qIdx, updated)}
                    onDelete={() => deleteQuestion(activePart, qIdx)}
                  />
                ))}
                <button
                  onClick={() => addQuestion(activePart)}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                >
                  + Add Another Question
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
