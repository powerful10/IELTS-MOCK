import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITest extends Document {
  title: string;
  description?: string;
  sectionType: 'reading' | 'listening';
  createdBy: Types.ObjectId;
  status: 'draft' | 'published';
  createdAt: Date;
}

const TestSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  sectionType: { type: String, enum: ['reading', 'listening'], default: 'reading' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);
