import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IListening extends Document {
  title: string;
  audioUrl: string;
  transcript?: string;
  testId?: Types.ObjectId;
  order: number;
  createdAt: Date;
}

const ListeningSchema: Schema = new Schema({
  title: { type: String, required: true },
  audioUrl: { type: String, required: true },
  transcript: { type: String, default: '' },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', default: null },
  order: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Listening || mongoose.model<IListening>('Listening', ListeningSchema);
