// ============================================================
// src/llm/stream-parser.ts — SSE 流解析器
// ============================================================

import type { StreamChunk } from './provider';

export class StreamParser {
  static async *parse(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncIterable<StreamChunk> {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              yield { type: 'delta', content: delta.content };
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.id) {
                  yield {
                    type: 'tool_call_start',
                    call: {
                      id: tc.id,
                      type: 'function',
                      function: {
                        name: tc.function?.name || '',
                        arguments: tc.function?.arguments || '',
                      },
                    },
                  };
                } else if (tc.function?.arguments && tc.index !== undefined) {
                  yield {
                    type: 'tool_call_delta',
                    id: `tool_${tc.index}`,
                    arguments: tc.function.arguments,
                  };
                }
              }
            }
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
