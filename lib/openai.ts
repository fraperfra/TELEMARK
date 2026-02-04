import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = apiKey
  ? new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Solo per sviluppo/demo - in produzione usa un backend
    })
  : null;

export const isOpenAIConfigured = !!apiKey;
