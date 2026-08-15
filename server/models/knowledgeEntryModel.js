import mongoose from 'mongoose';

const knowledgeEntrySchema = new mongoose.Schema({
  clientId: { type: String, required: true, trim: true, index: true },
  key: { type: String, required: true, trim: true },
  language: { type: String, required: true, enum: ['en', 'bg'], index: true },
  category: { type: String, required: true, trim: true },
  question: { type: String, required: true, trim: true },
  keywords: { type: [String], default: [] },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  href: { type: String, default: '', trim: true },
  embedding: { type: [Number], default: undefined, select: false },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

knowledgeEntrySchema.index({ clientId: 1, language: 1, key: 1 }, { unique: true });

const KnowledgeEntry = mongoose.model('KnowledgeEntry', knowledgeEntrySchema);

export default KnowledgeEntry;
