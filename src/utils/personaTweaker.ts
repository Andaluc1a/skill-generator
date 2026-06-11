// 角色微调引擎

import { OpenAICompatibleProvider } from '@/llm';
import type { ApiConfig, ChatMessage } from '@/llm';

export async function tweakPersona(
  currentPrompt: string,
  feedback: string,
  config: ApiConfig,
  signal?: AbortSignal,
): Promise<string> {
  const provider = new OpenAICompatibleProvider(config, signal);
  const metaMsg = `你是一个 System Prompt 调优器。当前角色的完整 System Prompt：

""" 
${currentPrompt}
"""

用户觉得这个角色还不够像，想调整：**${feedback}**

请根据用户的白话反馈修改 System Prompt。只改用户提到的地方，其他保持不变。
直接输出修改后的完整 System Prompt，不要解释。`;

  let result = '';
  for await (const chunk of provider.chat(
    [{ role: 'user', content: metaMsg }],
    undefined,
    { temperature: 0.3, maxTokens: 4096, stream: true }
  )) {
    if (chunk.type === 'delta') result += chunk.content;
    if (chunk.type === 'done') break;
    if (chunk.type === 'error') throw new Error(chunk.message);
  }
  const cleaned = result.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
  return cleaned.trim() || currentPrompt;
}

export async function streamChat(
  messages: ChatMessage[],
  config: ApiConfig,
  signal?: AbortSignal,
): Promise<string> {
  const provider = new OpenAICompatibleProvider(config, signal);
  let result = '';
  for await (const chunk of provider.chat(messages, undefined, { temperature: 0.8, maxTokens: 2048, stream: true })) {
    if (chunk.type === 'delta') result += chunk.content;
    if (chunk.type === 'done') break;
    if (chunk.type === 'error') throw new Error(chunk.message);
  }
  return result;
}
