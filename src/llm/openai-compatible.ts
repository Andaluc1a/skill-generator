// ============================================================
// src/llm/openai-compatible.ts — OpenAI 兼容 Provider
// ============================================================

import { LLMError, type ApiConfig, type ChatMessage, type ChatOptions, type LLMProvider, type StreamChunk, type ToolDefinition } from './provider';
import { StreamParser } from './stream-parser';
import { LLM_CONFIG } from '@/utils/constants';

export class OpenAICompatibleProvider implements LLMProvider {
  private config: ApiConfig;
  private signal?: AbortSignal;

  constructor(config: ApiConfig, signal?: AbortSignal) {
    this.config = config;
    this.signal = signal;
  }

  async *chat(messages: ChatMessage[], tools?: ToolDefinition[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    const temperature = options?.temperature ?? this.config.temperature;
    const maxTokens = options?.maxTokens ?? this.config.maxTokens;
    const stream = options?.stream ?? true;

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const url = `${this.config.baseURL.replace(/\/$/, '')}/chat/completions`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: this.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LLMError('请求已取消');
      }
      throw new LLMError(err instanceof Error ? err.message : '网络请求失败', undefined, '网络连接失败，请检查网络或 Base URL 配置');
    }

    if (!response.ok) {
      let providerMsg = '';
      try {
        const errBody = await response.json();
        providerMsg = errBody?.error?.message || '';
      } catch {
        // ignore
      }

      if (response.status === 429) {
        throw new LLMError('请求过于频繁，请稍后重试', response.status, providerMsg);
      }
      if (response.status === 401 || response.status === 403) {
        throw new LLMError('API Key 无效', response.status, providerMsg);
      }
      throw new LLMError(`API 请求失败 (${response.status})`, response.status, providerMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError('无法获取响应流');
    }

    for await (const chunk of StreamParser.parse(reader)) {
      yield chunk;
    }
  }
}
