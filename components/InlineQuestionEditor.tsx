'use client';

import { useState } from 'react';
import { Trash2, Plus, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'sentence_completion'
  | 'summary_completion'
  | 'short_answer';

export interface QuestionData {
  _id?: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

const QUESTION_TYPES: { value: QuestionType; label: string; short: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice', short: 'MCQ' },
  { value: 'true_false_not_given', label: 'True / False / Not Given', short: 'T/F/NG' },
  { value: 'matching_headings', label: 'Matching Headings', short: 'Headings' },
  { value: 'matching_information', label: 'Matching Information', short: 'Info' },
  { value: 'sentence_completion', label: 'Sentence Completion', short: 'Sent.' },
  { value: 'summary_completion', label: 'Summary Completion', short: 'Summ.' },
  { value: 'short_answer', label: 'Short Answer', short: 'Short' },
];

const TFNG_OPTIONS = ['True', 'False', 'Not Given'];

const typeColors: Record<QuestionType, string> = {
  multiple_choice: 'bg-blue-100 text-blue-700',
  true_false_not_given: 'bg-green-100 text-green-700',
  matching_headings: 'bg-purple-100 text-purple-700',
  matching_information: 'bg-violet-100 text-violet-700',
  sentence_completion: 'bg-amber-100 text-amber-700',
  summary_completion: 'bg-orange-100 text-orange-700',
  short_answer: 'bg-rose-100 text-rose-700',
};

interface Props {
  question: QuestionData;
  index: number;
  onChange: (updated: QuestionData) => void;
  onDelete: () => void;
}

export default function InlineQuestionEditor({ question, index, onChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true);

  const update = (partial: Partial<QuestionData>) => onChange({ ...question, ...partial });

  const handleTypeChange = (type: QuestionType) => {
    update({ questionType: type, correctAnswer: '', options: type === 'multiple_choice' ? ['', '', '', ''] : [] });
  };

  const handleOptionChange = (idx: number, value: string) => {
    const newOpts = [...question.options];
    newOpts[idx] = value;
    const newCorrect = question.correctAnswer === question.options[idx] ? value : question.correctAnswer;
    update({ options: newOpts, correctAnswer: newCorrect });
  };

  const addOption = () => update({ options: [...question.options, ''] });
  const removeOption = (idx: number) => {
    const newOpts = question.options.filter((_, i) => i !== idx);
    update({ options: newOpts, correctAnswer: question.correctAnswer === question.options[idx] ? '' : question.correctAnswer });
  };

  const typeLabel = QUESTION_TYPES.find(t => t.value === question.questionType);
  const showOptions = question.questionType === 'multiple_choice';
  const showTFNG = question.questionType === 'true_false_not_given';
  const showTextAnswer = ['matching_headings', 'matching_information', 'sentence_completion', 'summary_completion', 'short_answer'].includes(question.questionType);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Question Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer select-none hover:bg-slate-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical size={16} className="text-slate-300 shrink-0" />
        <span className="font-semibold text-slate-500 text-sm shrink-0">Q{index + 1}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${typeColors[question.questionType]}`}>
          {typeLabel?.short}
        </span>
        <p className="flex-1 text-sm text-slate-700 truncate">
          {question.questionText || <span className="italic text-slate-400">No question text yet...</span>}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Question Body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Question Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Question Type</label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map(qt => (
                <button
                  key={qt.value}
                  type="button"
                  onClick={() => handleTypeChange(qt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    question.questionType === qt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={question.questionText}
              onChange={(e) => update({ questionText: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all resize-none"
              placeholder="e.g., What is the main idea of paragraph 2?"
            />
          </div>

          {/* Multiple Choice Options */}
          {showOptions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Answer Options</label>
                <button type="button" onClick={addOption} className="flex items-center gap-1 text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                  <Plus size={12} /> Add Option
                </button>
              </div>
              {question.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question._id || index}`}
                    checked={question.correctAnswer === opt && opt !== ''}
                    onChange={() => update({ correctAnswer: opt })}
                    className="w-4 h-4 text-indigo-600 cursor-pointer shrink-0"
                    title="Mark as correct"
                  />
                  <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button type="button" onClick={() => removeOption(idx)} disabled={question.options.length <= 2} className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-slate-400">Click the radio button to mark the correct answer.</p>
            </div>
          )}

          {/* True/False/Not Given */}
          {showTFNG && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Correct Answer</label>
              <div className="flex gap-2">
                {TFNG_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update({ correctAnswer: opt, options: TFNG_OPTIONS })}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      question.correctAnswer === opt
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-300 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Answer */}
          {showTextAnswer && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={question.correctAnswer}
                onChange={(e) => update({ correctAnswer: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder={
                  question.questionType === 'matching_headings' ? 'e.g., Heading B' :
                  question.questionType === 'matching_information' ? 'e.g., Paragraph C' :
                  question.questionType === 'short_answer' ? 'e.g., 1952' :
                  'e.g., industrial revolution'
                }
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Explanation <span className="font-normal text-slate-400 normal-case">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={question.explanation}
              onChange={(e) => update({ explanation: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              placeholder="Why is this the correct answer?"
            />
          </div>
        </div>
      )}
    </div>
  );
}
