import mongoose, { Schema, Document, Types } from 'mongoose';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'matching_headings'
  | 'sentence_completion';

export interface IQuestion extends Document {
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  passageId?: Types.ObjectId;
  listeningId?: Types.ObjectId;
  createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false_not_given', 'matching_headings', 'sentence_completion'],
    default: 'multiple_choice',
  },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  passageId: { type: Schema.Types.ObjectId, ref: 'Passage', default: null },
  listeningId: { type: Schema.Types.ObjectId, ref: 'Listening', default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
