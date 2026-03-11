import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPassage extends Document {
  title: string;
  content: string;
  testId?: Types.ObjectId;
  order: number;
  createdAt: Date;
}

const PassageSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', default: null },
  order: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Passage || mongoose.model<IPassage>('Passage', PassageSchema);
