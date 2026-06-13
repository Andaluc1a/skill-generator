// ================================================================
// knowledgeExtractor.ts — LLM 自动提取知识条目
// ================================================================

import type { ApiConfig, ChatMessage } from '@/llm';

export interface KnowledgeEntry {
  id: string;
  keyword: string;
  content: string;
  enabled: boolean;
}

export async function extractKnowledge(
  rawText: string,
  config: ApiConfig,
  signal?: AbortSignal,
): Promise<KnowledgeEntry[]> {
  const { OpenAICompatibleProvider } = await import('@/llm');
  const provider = new OpenAICompatibleProvider(config, signal);

  const meta: ChatMessage[] = [{
    role: 'user',
    content: `从以下专业知识材料中，提取关键知识点。每个知识点包含一个关键词和一段解释。

材料：
"""
${rawText.slice(0, 4000)}
"""

输出 JSON 数组，每条格式：
{"keyword": "关键词（简短）", "content": "一句话解释（50字以内）"}

最多提取 10 条。只输出 JSON 数组，不要解释。`,
  }];

  let raw = '';
  for await (const chunk of provider.chat(meta, undefined, { temperature: 0.2, maxTokens: 2048, stream: true })) {
    if (chunk.type === 'delta') raw += chunk.content;
    if (chunk.type === 'done') break;
    if (chunk.type === 'error') throw new Error(chunk.message);
  }

  try {
    const cleaned = raw.trim().replace(/```json|```/g, '').trim();
    const items = JSON.parse(cleaned);
    return (Array.isArray(items) ? items : []).map((item: { keyword: string; content: string }, i: number) => ({
      id: `kw_${Date.now()}_${i}`,
      keyword: item.keyword,
      content: item.content,
      enabled: true,
    }));
  } catch {
    // 解析失败：按段落拆分
    return rawText.split('\n\n').filter(p => p.trim().length > 10).slice(0, 10).map((p, i) => ({
      id: `kw_${Date.now()}_${i}`,
      keyword: p.split(/[：:]/)[0]?.slice(0, 10) || `知识点${i + 1}`,
      content: p.slice(0, 100),
      enabled: true,
    }));
  }
}

/** 检查用户输入是否命中任何知识条目 */
export function matchKnowledge(
  userMessage: string,
  entries: KnowledgeEntry[],
): KnowledgeEntry[] {
  if (!userMessage || entries.length === 0) return [];
  const msg = userMessage.toLowerCase();
  return entries.filter(e =>
    e.enabled && msg.includes(e.keyword.toLowerCase()),
  ).slice(0, 3); // 最多注入 3 条
}

/** 生成可注入到对话中的知识提示 */
export function formatKnowledgePrompt(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return '';
  return '【相关背景知识】\n' + entries.map(e => `- ${e.keyword}：${e.content}`).join('\n');
}
