// ================================================================
// CreateWizard — 结构化填空式角色创建向导
// ================================================================

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stepper, Step, StepLabel, Box, Typography, Chip, ToggleButton, ToggleButtonGroup,
  Alert,
} from '@mui/material';
import { useApp, generateId } from '@/store/appStore';
import type { Character } from '@/types/character';
import { DEFAULT_API_CONFIG } from '@/llm';
import { OpenAICompatibleProvider } from '@/llm';
import { encodeBase64 } from '@/utils/storage';
import { LLM_CONFIG } from '@/utils/constants';

const TONE_OPTIONS = ['温柔', '毒舌', '幽默', '严肃', '傲娇', '话痨', '沉默', '热情', '夸张', '冷静', '幼稚', '沧桑'];
const STYLE_OPTIONS = ['句子很短', '句子很长', '爱用emoji', '从来不用emoji', '爱用感叹号', '爱用省略号', '爱用反问', '直接给结论', '有口音', '用方言', '爱用比喻', '说话直接'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateWizard({ open, onClose }: Props) {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState<string[]>([]);
  const [catchphrases, setCatchphrases] = useState(['', '', '']);
  const [style, setStyle] = useState<string[]>([]);
  const [topics, setTopics] = useState('');
  const [avoid, setAvoid] = useState('');
  const [samples, setSamples] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [firstMsg, setFirstMsg] = useState('');
  const [avatar, setAvatar] = useState('🤖');

  const steps = ['基本信息', '说话风格', '贴原话', '专业知识', '示例对话'];

  const toggleArray = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const handleGenerate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    // 尝试调 LLM 生成 System Prompt
    let systemPrompt = '';
    try {
      const raw = localStorage.getItem('sg_api_config');
      if (!raw) {
        // 离线模式：用模板构建 prompt
        systemPrompt = buildOfflinePrompt({ name, description, tone, catchphrases: catchphrases.filter(Boolean), style, topics, avoid, samples, knowledge, firstMsg, avatar });
      } else {
        const config = { ...DEFAULT_API_CONFIG, apiKey: '' };
        try { Object.assign(config, JSON.parse(raw)); } catch { /* ignore */ }
        if (config.apiKey) {
          config.apiKey = decodeURIComponent(escape(atob(config.apiKey)));
          systemPrompt = await generateWithLLM(config, { name, description, tone, catchphrases: catchphrases.filter(Boolean), style, topics, avoid, samples, knowledge, firstMsg, avatar });
        } else {
          systemPrompt = buildOfflinePrompt({ name, description, tone, catchphrases: catchphrases.filter(Boolean), style, topics, avoid, samples, knowledge, firstMsg, avatar });
        }
      }
    } catch (err) {
      // LLM 失败 → 离线生成
      systemPrompt = buildOfflinePrompt({ name, description, tone, catchphrases: catchphrases.filter(Boolean), style, topics, avoid, samples, knowledge, firstMsg, avatar });
    }

    const char: Character = {
      id: generateId(),
      name: name.trim(),
      description: description.trim() || `${name}——${tone.slice(0, 2).join('又')}的AI角色`,
      avatar,
      systemPrompt,
      firstMessage: firstMsg.trim() || `你好，我是${name}。`,
      tags: tone.slice(0, 3),
      tone,
      catchphrases: catchphrases.filter(Boolean),
      style,
      topics: topics.trim() ? topics.split(/[,，、\n]/).map(t => t.trim()).filter(Boolean) : [],
      avoid: avoid.trim(),
      knowledge: knowledge.trim(),
      samples: samples.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dispatch({ type: 'ADD_CHARACTER', payload: char });
    setLoading(false);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep(0); setName(''); setDescription(''); setTone([]);
    setCatchphrases(['', '', '']); setStyle([]); setTopics('');
    setAvoid(''); setSamples(''); setKnowledge(''); setFirstMsg(''); setAvatar('🤖');
    setError('');
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>创建你的 AI 角色</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 0: 基本信息 */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField value={avatar} onChange={e => setAvatar(e.target.value)} sx={{ width: 80 }} inputProps={{ style: { fontSize: 28, textAlign: 'center' } }} helperText="头像" />
              <TextField label="角色名字" value={name} onChange={e => setName(e.target.value)} fullWidth required placeholder="比如：老王、亚丝娜" />
            </Box>
            <TextField label="一句话介绍 ta" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={2} placeholder="一个很嘴但真心对我好的死党" helperText="像跟朋友介绍一个人一样随意写" />
          </Box>
        )}

        {/* Step 1: 说话风格 */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>说话的语气（可多选）</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {TONE_OPTIONS.map(t => (
                  <Chip key={t} label={t} variant={tone.includes(t) ? 'filled' : 'outlined'} color="primary" size="small" onClick={() => toggleArray(tone, setTone, t)} />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>口头禅（强烈建议填！）</Typography>
              {[0, 1, 2].map(i => (
                <TextField key={i} value={catchphrases[i]} onChange={e => { const n = [...catchphrases]; n[i] = e.target.value; setCatchphrases(n); }} size="small" sx={{ mb: 1 }} fullWidth placeholder={`口头禅${i + 1}，如 "哼！" "我跟你说"`} />
              ))}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>说话特点（可多选）</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {STYLE_OPTIONS.map(s => (
                  <Chip key={s} label={s} variant={style.includes(s) ? 'filled' : 'outlined'} color="secondary" size="small" onClick={() => toggleArray(style, setStyle, s)} />
                ))}
              </Box>
            </Box>
            <TextField label="ta 喜欢聊什么话题" value={topics} onChange={e => setTopics(e.target.value)} fullWidth size="small" placeholder="天气、做饭、养花（用逗号分隔）" />
            <TextField label="ta 绝对不说什么" value={avoid} onChange={e => setAvoid(e.target.value)} fullWidth size="small" placeholder="脏话、对不起、我不知道" />
          </Box>
        )}

        {/* Step 2: 贴原话 */}
        {step === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>最关键的一步！把 ta 说过的原话贴进来，哪怕3-5句也很有用。从弹幕截图、聊天记录、漫画台词里找。</Alert>
            <TextField label="贴 ta 的原话" value={samples} onChange={e => setSamples(e.target.value)} fullWidth multiline minRows={6} maxRows={12} placeholder={`"哼！我才不是关心你呢！"\n"笨蛋，这点小事都做不好..."\n"你...你回来了啊...还挺想你的..."`} />
          </Box>
        )}

        {/* Step 3: 专业知识 */}
        {step === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>选填。如果只是聊天陪伴，跳过这步。如果你想让 ta 有专业知识（如法考老师、医生），把相关资料贴进来。</Alert>
            <TextField label="专业知识材料" value={knowledge} onChange={e => setKnowledge(e.target.value)} fullWidth multiline minRows={5} maxRows={10} placeholder="粘贴文章、笔记、教材片段..." />
          </Box>
        )}

        {/* Step 4: 示例对话 */}
        {step === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>写一句 ta 的开口第一句话。用户第一次跟 ta 聊天时，ta 会主动说这句。</Alert>
            <TextField label="ta 的开场白" value={firstMsg} onChange={e => setFirstMsg(e.target.value)} fullWidth multiline minRows={2} placeholder="桐人君，你终于来了！/ 哎呀妈呀，可算来人了！/ 查询已接收。请描述你的需求。" />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => {
          if (step > 0) setStep(step - 1);
          else { resetForm(); onClose(); }
        }} color="inherit">
          {step === 0 ? '取消' : '上一步'}
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} variant="contained" disabled={step === 0 && !name.trim()}>
            下一步
          </Button>
        ) : (
          <Button onClick={handleGenerate} variant="contained" color="primary" disabled={loading || !name.trim()}>
            {loading ? '🎨 生成中...' : '🎨 生成角色'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// 离线生成 System Prompt（不需要 LLM API）
function buildOfflinePrompt(data: {
  name: string; description: string; tone: string[]; catchphrases: string[];
  style: string[]; topics: string; avoid: string; samples: string;
  knowledge: string; firstMsg: string; avatar: string;
}): string {
  const parts = [
    `你是${data.name}。${data.description || '一个独特的AI角色'}。`,
    `你永远以${data.name}的身份说话，不跳出角色。`,
  ];
  if (data.tone.length) parts.push(`说话语气：${data.tone.join('、')}。`);
  if (data.catchphrases.length) parts.push(`常用口头禅：${data.catchphrases.join('、')}。`);
  if (data.style.length) parts.push(`说话特点：${data.style.join('、')}。`);
  if (data.topics.trim()) parts.push(`你喜欢的聊天话题：${data.topics}。`);
  if (data.avoid.trim()) parts.push(`你绝对不说的话或不做的事：${data.avoid}。`);
  if (data.samples.trim()) parts.push(`以下是你说过的话，请模仿这种说话方式：\n"""\n${data.samples}\n"""`);
  if (data.knowledge.trim()) parts.push(`你拥有以下专业知识，回答相关问题时请引用：\n"""\n${data.knowledge}\n"""`);
  parts.push('回答要符合你的角色设定。不要用"作为一个AI"或"我无法"这类话。你就是这个角色。');
  return parts.join('\n\n');
}

// LLM 生成 System Prompt
async function generateWithLLM(config: { model: string; baseURL: string; apiKey: string; temperature: number; maxTokens: number }, data: {
  name: string; description: string; tone: string[]; catchphrases: string[];
  style: string[]; topics: string; avoid: string; samples: string;
  knowledge: string; firstMsg: string; avatar: string;
}): Promise<string> {
  const provider = new OpenAICompatibleProvider(config as any);
  const metaPrompt = `你是一个 System Prompt 设计专家。根据以下信息，生成一份能让 AI 精确扮演这个角色的 System Prompt。

角色名称：${data.name}
性格描述：${data.description || '未指定'}
说话语气：${data.tone.join('、') || '未指定'}
口头禅：${data.catchphrases.join('、') || '未指定'}
说话特点：${data.style.join('、') || '未指定'}
喜欢的话题：${data.topics || '未指定'}
禁忌：${data.avoid || '未指定'}
原话样本：${data.samples ? '\n"""\n' + data.samples + '\n"""' : '无'}
专业知识：${data.knowledge ? '\n"""\n' + data.knowledge + '\n"""' : '无'}

System Prompt 必须包含：
1. 角色身份声明（我是谁）
2. 说话风格约束（语气、口头禅、句式）
3. 行为准则（该做什么、不该做什么）
4. 知识范围
5. 示例对话（如果有样本的话）

直接输出完整 System Prompt，不要任何解释或标签。`;

  let result = '';
  for await (const chunk of provider.chat(
    [{ role: 'user', content: metaPrompt }],
    undefined,
    { temperature: 0.7, maxTokens: 2048, stream: true }
  )) {
    if (chunk.type === 'delta') result += chunk.content;
    if (chunk.type === 'done') break;
    if (chunk.type === 'error') throw new Error(chunk.message);
  }
  const cleaned = result.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
  return cleaned.trim() || buildOfflinePrompt(data);
}
