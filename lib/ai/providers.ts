import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  titleModel,
} from './models.test';

// Wrapper function to add maxImagesPerCall property to image models
function wrapImageModel(model: any) {
  return {
    ...model,
    maxImagesPerCall: model.maxImagesPerCall || 1,
  };
}

// Configure OpenAI with optimized settings
const configureOpenAI = (model: string) => {
  return openai.chat(model, {
    // OpenAI chat settings
    logitBias: {},
    user: 'system-user',
  });
};

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        // Use gpt-4o-mini for faster responses
        'chat-model': configureOpenAI('gpt-4o-mini'), // Using OpenAI chat API
        'title-model': configureOpenAI('gpt-4o-mini'), // Using OpenAI chat API
        'artifact-model': configureOpenAI('gpt-4o-mini'), // Using OpenAI chat API
      },
      imageModels: {
        'small-model': wrapImageModel(openai.image('dall-e-3')),
      },
    });
