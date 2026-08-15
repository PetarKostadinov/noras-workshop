import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ASSISTANT_KNOWLEDGE } from '../data/assistantKnowledge.js';
import KnowledgeEntry from '../models/knowledgeEntryModel.js';

dotenv.config();

const clientId = process.env.ASSISTANT_CLIENT_ID || 'noras-workshop';
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shoppingcart';

const run = async () => {
  await mongoose.connect(mongoUri);

  for (const entry of ASSISTANT_KNOWLEDGE) {
    await KnowledgeEntry.updateOne(
      { clientId, language: entry.language, key: entry.key },
      { $set: { ...entry, clientId, active: true } },
      { upsert: true },
    );
    console.log(`Seeded basic ${entry.language}/${entry.key}`);
  }
};

run()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
