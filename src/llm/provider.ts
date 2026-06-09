// ================================================================
// src/llm/provider.ts — LLM Provider 核心类型
// ================================================================

/*** StreamChunk */
export type StreamChunk =
  | { type: 'delta'; content: string }
  | { type: 'tool_call_start'; call: ToolCallRequest }
  | { type: 'tool_call_delta'; id: string; arguments: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/*** ToolCallRequest */
export interface ToolCallRequest {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

/*** ChatMessage */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCallRequest[];
}

/*** LLMError */
export class LLMError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public providerMessage?: string,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/*** LLMProvider */
export interface LLMProvider {
  chat(messages: ChatMessage[], tools?: ToolDefinition[], options?: ChatOptions): AsyncIterable<StreamChunk>;
}

/*** ChatOptions */
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/*** ApiConfig */
export interface ApiConfig {
  provider: 'openai' | 'deepseek' | 'qwen' | 'custom';
  model: string;
  baseURL: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export const DEFAULT_API_CONFIG: Omit<ApiConfig, 'apiKey'> = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  baseURL: 'https://api.deepseek.com/v1',
  temperature: 0.8,
  maxTokens: 4096,
};

/*** ToolDefinition */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ParameterProperty>;
      required: string[];
    };
  };
}

export interface ParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: { type: string };
}
