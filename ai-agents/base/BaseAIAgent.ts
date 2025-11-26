export type GPTModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

export interface ModelConfiguration {
  primary?: GPTModel;
  secondary?: GPTModel;
  fallback?: GPTModel;
}

export interface OpenAIRequestOptions {
  model?: GPTModel;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  systemPrompt?: string;
  userPrompt: string;
  streaming?: boolean;
}

export interface OpenAIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export abstract class BaseAIAgent {
  protected openaiApiKey: string;
  protected defaultModels: ModelConfiguration;
  protected agentName: string;

  constructor(agentName: string, defaultModels?: ModelConfiguration) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.agentName = agentName;
    this.defaultModels = defaultModels || {
      primary: 'gpt-4o-mini',
      secondary: 'gpt-4o-mini',
      fallback: 'gpt-3.5-turbo'
    };
  }

  setDefaultModels(models: Partial<ModelConfiguration>) {
    this.defaultModels = { ...this.defaultModels, ...models };
  }

  getDefaultModels(): ModelConfiguration {
    return { ...this.defaultModels };
  }

  static getModelConfigForComplexity(complexity: 'simple' | 'standard' | 'complex'): ModelConfiguration {
    switch (complexity) {
      case 'simple':
        return {
          primary: 'gpt-4o-mini',
          secondary: 'gpt-4o-mini',
          fallback: 'gpt-3.5-turbo'
        };
      case 'standard':
        return {
          primary: 'gpt-4o-mini',
          secondary: 'gpt-4o-mini',
          fallback: 'gpt-3.5-turbo'
        };
      case 'complex':
        return {
          primary: 'gpt-4o',
          secondary: 'gpt-4o-mini',
          fallback: 'gpt-4o-mini'
        };
      default:
        return {
          primary: 'gpt-4o-mini',
          secondary: 'gpt-4o-mini',
          fallback: 'gpt-3.5-turbo'
        };
    }
  }

  static getModelForUseCase(useCase: 'content_generation' | 'text_processing' | 'quiz_creation' | 'analysis' | 'creative_writing'): GPTModel {
    switch (useCase) {
      case 'content_generation':
        return 'gpt-4o-mini';
      case 'text_processing':
        return 'gpt-4o-mini';
      case 'quiz_creation':
        return 'gpt-4o-mini';
      case 'analysis':
        return 'gpt-4o-mini';
      case 'creative_writing':
        return 'gpt-4o';
      default:
        return 'gpt-4o-mini';
    }
  }

  protected async makeOpenAIRequest(options: OpenAIRequestOptions): Promise<OpenAIResponse> {
    const model = options.model || this.defaultModels.primary || 'gpt-4o-mini';
    
    console.log(`[${this.agentName}] Using model: ${model}`);

    const requestBody = {
      model,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        { role: 'user' as const, content: options.userPrompt }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 8192,
      ...(options.responseFormat === 'json_object' ? { response_format: { type: 'json_object' } } : {}),
      stream: options.streaming ?? false
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error(`[${this.agentName}] OpenAI response data:`, JSON.stringify(data, null, 2));
        throw new Error(`No content generated from OpenAI. Response: ${JSON.stringify(data)}`);
      }

      return {
        content,
        model: data.model || model,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined
      };

    } catch (error) {
      console.error(`[${this.agentName}] OpenAI request failed with model ${model}:`, error);
      
      if (this.defaultModels.fallback && this.defaultModels.fallback !== model) {
        console.log(`[${this.agentName}] Retrying with fallback model: ${this.defaultModels.fallback}`);
        return this.makeOpenAIRequest({
          ...options,
          model: this.defaultModels.fallback
        });
      }
      
      throw error;
    }
  }

  protected parseJSONResponse<T>(content: string): T {
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected logUsage(operation: string, model: string, usage?: OpenAIResponse['usage']) {
    if (usage) {
      console.log(`[${this.agentName}] ${operation} - Model: ${model}, Tokens: ${usage.totalTokens} (${usage.promptTokens} + ${usage.completionTokens})`);
    }
  }
}

export default BaseAIAgent;
