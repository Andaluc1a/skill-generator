// ================================================================
// voiceExtractor.ts — 两步生成 System Prompt 引擎
// ================================================================

import { OpenAICompatibleProvider } from '@/llm';
import { DEFAULT_API_CONFIG, type ApiConfig, type ChatMessage } from '@/llm';
import { decodeBase64 } from './storage';

interface VoiceProfile {
  tone: string[];
  catchphrases: string[];
  sentencePattern: string;
  emotionalRange: string;
  summary: string;
  samples: string[];
}

interface BuildInput {
  name: string;
  description: string;
  tone: string[];
  catchphrases: string[];
  style: string[];
  topics: string;
  avoid: string;
  knowledge: string;
  firstMsg: string;
  rawSamples: string;
  sampleSide: 'left' | 'right' | 'monologue';
  myIdentity?: string;
}

export type ProgressCallback = (step: number, label: string) => void;

export async function generateSystemPrompt(
  input: BuildInput,
  onProgress?: ProgressCallback,
): Promise<string> {
  // 无 rawSamples 时走离线生成
  if (!input.rawSamples.trim()) {
    onProgress?.(3, '正在构建角色');
    return buildOfflinePrompt(input);
  }

  const config = loadConfig();
  if (!config?.apiKey) {
    onProgress?.(3, '未配置 API，使用离线生成');
    return buildOfflinePrompt(input);
  }

  const provider = new OpenAICompatibleProvider(config);

  try {
    // Step 1: 提取角色画像
    onProgress?.(1, '正在分析 ta 的说话方式...');
    const profile = await extractProfile(provider, input);

    // Step 2: 生成示例对话
    onProgress?.(2, '正在生成示例对话...');
    const enhancedSamples = await generateSamples(provider, profile, input);

    // Step 3: 构建 System Prompt
    onProgress?.(3, '正在构建角色...');
    return buildPromptFromProfile(profile, enhancedSamples, input);
  } catch (err) {
    console.warn('两步生成失败，回退离线生成:', err);
    onProgress?.(3, '正在构建角色（离线模式）');
    return buildOfflinePrompt(input);
  }
}

async function extractProfile(
  provider: OpenAICompatibleProvider,
  input: BuildInput,
): Promise<VoiceProfile> {
  const sideHint = input.sampleSide === 'left'
    ? '左边是对方，右边是目标说话人。请分析右边的人。'
    : input.sampleSide === 'right'
    ? '右边是对方，左边是目标说话人。请分析左边的人。'
    : '这是一段目标说话人的独白或语录。';

  const meta: ChatMessage[] = [{
    role: 'user',
    content: `分析以下对话或语录，提取说话人的语气特征。

${sideHint}

对话内容：
"""
${input.rawSamples.slice(0, 3000)}
"""

请用 JSON 格式输出：
{
  "tone": ["语气词1", "语气词2"],
  "catchphrases": ["口头禅1", "口头禅2"],
  "sentencePattern": "一句话概括句式特点，如'短句为主，结尾爱加省略号'",
  "emotionalRange": "一句话概括情感特点，如'表面冷淡但实际关心'",
  "summary": "一段50字以内的人设摘要"
}

只输出 JSON，不要解释。`,
  }];

  let raw = '';
  for await (const chunk of provider.chat(meta, undefined, { temperature: 0.3, maxTokens: 1024, stream: true })) {
    if (chunk.type === 'delta') raw += chunk.content;
    if (chunk.type === 'done') break;
    if (chunk.type === 'error') throw new Error(chunk.message);
  }

  try {
    const json = JSON.parse(raw.trim().replace(/```json|```/g, '').trim());
    return {
      tone: json.tone || input.tone,
      catchphrases: json.catchphrases || input.catchphrases,
      sentencePattern: json.sentencePattern || input.style.join('、'),
      emotionalRange: json.emotionalRange || '',
      summary: json.summary || input.description,
      samples: [],
    };
  } catch {
    return fallbackProfile(input);
  }
}

async function generateSamples(
  provider: OpenAICompatibleProvider,
  profile: VoiceProfile,
  input: BuildInput,
): Promise<string[]> {
  const meta: ChatMessage[] = [{
    role: 'user',
    content: `根据以下人设，生成 3 句这个人会说的话。

人设：${profile.summary}
语气：${profile.tone.join('、')}
口头禅：${profile.catchphrases.join('、')}
句式：${profile.sentencePattern}
情感：${profile.emotionalRange}
角色名：${input.name}

每一句格式：
对方说：[一句日常对话]
${input.name}说：[一句符合人设的回复]

生成 3 句不同场景的对话。只输出对话，不要解释。`,
  }];

  let raw = '';
  for await (const chunk of provider.chat(meta, undefined, { temperature: 0.8, maxTokens: 512, stream: true })) {
    if (chunk.type === 'delta') raw += chunk.content;
    if (chunk.type === 'done') break;
    if (chunk.type === 'error') throw new Error(chunk.message);
  }

  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.includes('说：'));
  return lines.length > 0 ? lines : [];
}

function buildPromptFromProfile(
  profile: VoiceProfile,
  samples: string[],
  input: BuildInput,
): string {
  const parts: string[] = [
    `你是${input.name}。${profile.summary || input.description}。永远以${input.name}的身份说话。`,
  ];
  if (profile.tone.length) parts.push(`说话语气：${profile.tone.join('、')}。`);
  if (profile.catchphrases.length) parts.push(`常用口头禅：${profile.catchphrases.join('、')}。`);
  if (profile.sentencePattern) parts.push(`句式特点：${profile.sentencePattern}。`);
  if (profile.emotionalRange) parts.push(`情感特点：${profile.emotionalRange}。`);
  if (input.avoid.trim()) parts.push(`绝对不做或不说：${input.avoid}。`);
  if (input.knowledge.trim()) parts.push(`专业知识：\n"""\n${input.knowledge}\n"""`);
  if (samples.length > 0) {
    parts.push(`以下是你说过的话，请严格模仿：\n"""\n${samples.join('\n')}\n"""`);
  }
  if (input.myIdentity) {
    parts.push(`【与你聊天的人】${input.myIdentity}。当ta问"我是谁"或类似身份问题时，直接引用这里的信息，不要自己编造。`);
  }
  parts.push('你就是这个角色。用角色的语气回答。不要在回复外加引号或"角色名："前缀。');
  return parts.join('\n\n');
}

function buildOfflinePrompt(input: BuildInput): string {
  const parts = [
    `你是${input.name}。${input.description || '一个独特的 AI 角色'}。永远以${input.name}的身份说话。`,
  ];
  if (input.tone.length) parts.push(`说话语气：${input.tone.join('、')}。`);
  if (input.catchphrases.length) parts.push(`常用口头禅：${input.catchphrases.join('、')}。`);
  if (input.style.length) parts.push(`句式特点：${input.style.join('、')}。`);
  if (input.topics.trim()) parts.push(`喜欢的话题：${input.topics}。`);
  if (input.avoid.trim()) parts.push(`不能说或做：${input.avoid}。`);
  if (input.rawSamples.trim()) parts.push(`参考材料：\n"""\n${input.rawSamples.slice(0, 1500)}\n"""`);
  if (input.knowledge.trim()) parts.push(`专业知识：\n"""\n${input.knowledge}\n"""`);
  if (input.myIdentity) parts.push(`【与你聊天的人】${input.myIdentity}。当ta问"我是谁"或类似身份问题时，直接引用这里的信息，不要自己编造。`);
  parts.push('用角色的语气回答。不要在回复外加引号。');
  return parts.join('\n\n');
}

function fallbackProfile(input: BuildInput): VoiceProfile {
  return {
    tone: input.tone,
    catchphrases: input.catchphrases,
    sentencePattern: input.style.join('、'),
    emotionalRange: input.topics,
    summary: input.description,
    samples: [],
  };
}

function loadConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem('sg_api_config');
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    if (!cfg.apiKey) return null;
    cfg.apiKey = decodeBase64(cfg.apiKey);
    return cfg;
  } catch { return null; }
}
