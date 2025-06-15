// lib/ai-providers.js - Unified AI provider interface
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

class AIProvider {
  constructor() {
    this.provider = process.env.AI_MODEL_PROVIDER || 'openai';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2000;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.3;
    
    console.log(`Initializing AI Provider: ${this.provider}`);
    
    if (this.provider === 'openai') {
      this.initOpenAI();
    } else if (this.provider === 'gemini') {
      this.initGemini();
    } else {
      throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }
  
  initOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
    }
    
    this.openai = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }
  
  initGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required when using Gemini provider');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
    this.geminiModel = this.genAI.getGenerativeModel({ model: this.model });
  }
  
  /**
   * Generate content with vision capabilities
   * @param {Object} params - Parameters for content generation
   * @param {string} params.systemPrompt - System instructions
   * @param {Array} params.correctImages - Array of correct answer image URLs
   * @param {Array} params.studentImages - Array of student answer image URLs
   * @param {string} params.userPrompt - User prompt text
   * @returns {Object} Response with content, usage stats, and timing
   */
  async generateVisionContent({ systemPrompt, correctImages, studentImages, userPrompt }) {
    const startTime = Date.now();
    
    if (this.provider === 'openai') {
      return this.generateOpenAIContent({ systemPrompt, correctImages, studentImages, userPrompt, startTime });
    } else if (this.provider === 'gemini') {
      return this.generateGeminiContent({ systemPrompt, correctImages, studentImages, userPrompt, startTime });
    }
  }
  
  async generateOpenAIContent({ systemPrompt, correctImages, studentImages, userPrompt, startTime }) {
    // Format messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: [{ type: 'text', text: systemPrompt }]
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Here are the correct answer images:' },
          ...correctImages.map(url => ({
            type: 'image_url',
            image_url: { url, detail: 'high' }
          })),
          { type: 'text', text: 'Here are the student answer images:' },
          ...studentImages.map(url => ({
            type: 'image_url',
            image_url: { url, detail: 'high' }
          })),
          { type: 'text', text: userPrompt }
        ]
      }
    ];
    
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    });
    
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);
    
    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      timeTaken,
      model: this.model,
      provider: 'openai'
    };
  }
  
  /**
   * Fetch image as base64 from URL
   * Works in Node.js environment
   */
  async fetchImageAsBase64(url) {
    try {
      console.log(`Fetching image from: ${url}`);
      
      // For data URLs, extract the base64 part
      if (url.startsWith('data:')) {
        const base64Data = url.split(',')[1];
        return base64Data;
      }
      
      // For HTTP URLs, fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Get the array buffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Convert to base64
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      console.log(`Successfully converted image to base64 (${base64.length} chars)`);
      return base64;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }
  
  async generateGeminiContent({ systemPrompt, correctImages, studentImages, userPrompt, startTime }) {
    try {
      console.log('Generating content with Gemini using inline data approach...');
      
      // Build the prompt parts for Gemini
      const parts = [];
      
      // Add combined system prompt and user prompt
      parts.push({ text: `${systemPrompt}\n\n${userPrompt}` });
      
      // Convert and add correct answer images
      parts.push({ text: '\n\nHere are the correct answer images:' });
      for (const imageUrl of correctImages) {
        if (imageUrl) {
          try {
            const base64Data = await this.fetchImageAsBase64(imageUrl);
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            });
          } catch (error) {
            console.error('Error processing correct answer image:', error);
            // Skip this image if there's an error
          }
        }
      }
      
      // Convert and add student answer images
      parts.push({ text: '\n\nHere are the student answer images:' });
      for (const imageUrl of studentImages) {
        if (imageUrl) {
          try {
            const base64Data = await this.fetchImageAsBase64(imageUrl);
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            });
          } catch (error) {
            console.error('Error processing student answer image:', error);
            // Skip this image if there's an error
          }
        }
      }
      
      // Add the comparison instruction again for clarity
      parts.push({ text: '\n\nCompare the student answers with the correct answers and provide your assessment.' });
      
      console.log(`Sending request to Gemini with ${parts.length} parts`);
      
      // Generate content
      const result = await this.geminiModel.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
          topK: 40,
          topP: 0.95,
        },
      });
      
      const response = await result.response;
      const text = response.text();
      
      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);
      
      console.log(`Gemini response received in ${timeTaken}s`);
      
      // Get token usage from response if available
      let usage = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      };
      
      // Check if usage metadata is available
      if (response.usageMetadata) {
        usage = {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0
        };
      } else {
        // Estimate tokens if not provided
        const estimatedTokens = Math.ceil(text.length / 4);
        usage = {
          promptTokens: estimatedTokens * 2,
          completionTokens: estimatedTokens,
          totalTokens: estimatedTokens * 3
        };
      }
      
      return {
        content: text,
        usage,
        timeTaken,
        model: this.model,
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
  
  /**
   * Stream content generation (for future use)
   * Currently returns the same as generateVisionContent
   */
  async streamVisionContent(params) {
    // For now, both providers will use non-streaming
    // This can be enhanced later to support true streaming
    return this.generateVisionContent(params);
  }
}

// Export singleton instance
let aiProviderInstance = null;

export function getAIProvider() {
  if (!aiProviderInstance) {
    aiProviderInstance = new AIProvider();
  }
  return aiProviderInstance;
}

export default AIProvider;
