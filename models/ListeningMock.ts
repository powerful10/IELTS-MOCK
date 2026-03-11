import mongoose, { Schema, Document } from 'mongoose';

export type ListeningQuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'sentence_completion'
  | 'summary_completion'
  | 'short_answer';

export interface IListeningQuestion {
  _id?: string;
  questionText: string;
  questionType: ListeningQuestionType;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  order: number;
}

export interface IListeningPart {
  _id?: string;
  partNumber: 1 | 2 | 3 | 4;
  audioUrl: string;
  transcript: string;
  questions: IListeningQuestion[];
}

export interface IListeningMock extends Document {
  title: string;
  status: 'draft' | 'published';
  parts: IListeningPart[];
  createdAt: Date;
}

const ListeningQuestionSchema = new Schema({
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false_not_given', 'matching_headings', 'matching_information', 'sentence_completion', 'summary_completion', 'short_answer'],
    default: 'multiple_choice',
  },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  order: { type: Number, default: 1 },
});

const ListeningPartSchema = new Schema({
  partNumber: { type: Number, enum: [1, 2, 3, 4], required: true },
  audioUrl: { type: String, default: '' },
  transcript: { type: String, default: '' },
  questions: { type: [ListeningQuestionSchema], default: [] },
});

const ListeningMockSchema = new Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  parts: { type: [ListeningPartSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ListeningMock || mongoose.model<IListeningMock>('ListeningMock', ListeningMockSchema);
