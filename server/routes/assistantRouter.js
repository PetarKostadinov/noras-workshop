import express from 'express';
import asyncHandler from 'express-async-handler';
import { answerAssistantQuestion } from '../services/assistantService.js';
import { createRateLimiter } from '../utils.js';

const assistantRouter = express.Router();
const SUPPORTED_LANGUAGES = new Set(['en', 'bg']);
const MAX_MESSAGE_LENGTH = 500;
const assistantRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many assistant requests. Please wait a few minutes and try again.',
});

export const validateAssistantRequest = ({ message, language } = {}) => {
  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  if (!cleanMessage) throw Object.assign(new Error('Please enter a question'), { status: 400 });
  if (cleanMessage.length > MAX_MESSAGE_LENGTH) throw Object.assign(new Error(`Questions must be ${MAX_MESSAGE_LENGTH} characters or fewer`), { status: 400 });
  if (!SUPPORTED_LANGUAGES.has(language)) throw Object.assign(new Error('Unsupported assistant language'), { status: 400 });
  return { message: cleanMessage, language };
};

assistantRouter.post('/message', assistantRateLimiter, asyncHandler(async (req, res) => {
  const input = validateAssistantRequest(req.body);
  const result = await answerAssistantQuestion(input);
  res.send(result);
}));

export default assistantRouter;
