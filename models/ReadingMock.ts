import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'sentence_completion'
  | 'summary_completion'
  | 'short_answer';

export interface IReadingQuestion {
  _id?: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  order: number;
}

export interface IReadingPassage {
  _id?: string;
  passageNumber: 1 | 2 | 3;
  title: string;
  content: string;
  questions: IReadingQuestion[];
}

export interface IReadingMock extends Document {
  title: string;
  status: 'draft' | 'published';
  passages: IReadingPassage[];
  createdAt: Date;
}

const ReadingQuestionSchema = new Schema({
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

const ReadingPassageSchema = new Schema({
  passageNumber: { type: Number, enum: [1, 2, 3], required: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  questions: { type: [ReadingQuestionSchema], default: [] },
});

const ReadingMockSchema = new Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  passages: { type: [ReadingPassageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ReadingMock || mongoose.model<IReadingMock>('ReadingMock', ReadingMockSchema);
