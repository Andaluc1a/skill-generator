// ================================================================
// sampleMemory.ts — 原话样本记忆，按需注入最相似的示例
// ================================================================

import type { ChatMessage } from '@/llm';

interface SamplePair {
  user: string;
  reply: string;
}

/** 从用户贴的原始对话中解析出对话对 */
export function parseSamplePairs(rawSamples: string, mySide: 'left' | 'right' | 'monologue'): SamplePair[] {
  const lines = rawSamples.split('\n').filter(l => l.trim());
  const pairs: SamplePair[] = [];

  if (mySide === 'monologue') {
    // 单边语录：每行当一句
    return lines.map(l => ({ user: '...', reply: l.trim() }));
  }

  // 双边对话：按模式匹配
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i]?.trim() || '';
    const b = lines[i + 1]?.trim() || '';

    // 检测常见对话格式
    const hasName = /^[^\s：:]+[：:]/.test(a) && /^[^\s：:]+[：:]/.test(b);
    if (hasName) {
      const aName = a.split(/[：:]/)[0] || '';
      const bName = b.split(/[：:]/)[0] || '';
      if (aName !== bName) {
        // 两个人交替说话
        if (mySide === 'right') {
          pairs.push({ user: a.replace(/^[^：:]+[：:]/, '').trim(), reply: b.replace(/^[^：:]+[：:]/, '').trim() });
        } else {
          pairs.push({ user: b.replace(/^[^：:]+[：:]/, '').trim(), reply: a.replace(/^[^：:]+[：:]/, '').trim() });
        }
        i++; // 跳过下一行
      }
    }
  }

  // 没解析出格式，降级：每一行当一条
  if (pairs.length === 0 && mySide !== 'monologue') {
    for (let i = 0; i < lines.length - 1; i += 2) {
      pairs.push({ user: lines[i]?.trim() || '', reply: lines[i + 1]?.trim() || '' });
    }
  }

  return pairs.slice(0, 20);
}

/** 根据用户当前输入，找最相似的 3 个样本 */
export function findRelevantSamples(
  userMessage: string,
  pairs: SamplePair[],
  count = 3,
): SamplePair[] {
  if (pairs.length === 0) return [];

  const msgWords = userMessage.toLowerCase().split(/\s+/);
  if (msgWords.length === 0) return pairs.slice(0, count);

  // 词重叠度打分
  const scored = pairs.map(p => {
    const text = (p.user + ' ' + p.reply).toLowerCase();
    let score = 0;
    for (const w of msgWords) {
      if (text.includes(w)) score += 1;
    }
    return { pair: p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .filter(s => s.score > 0)
    .map(s => s.pair);
}

/** 格式化为可注入对话的 few-shot prompt */
export function formatSamplePrompt(pairs: SamplePair[], charName: string): string {
  if (pairs.length === 0) return '';
  const lines = pairs.map(p =>
    `对方说：「${p.user}」\n${charName}说：「${p.reply}」`,
  );
  return '【以下是 ta 在类似情境下的真实对话，请严格模仿语气和回复风格】\n' + lines.join('\n\n');
}
