// ================================================================
// CreateWizard — 结构化填空式角色创建向导
// ================================================================

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stepper, Step, StepLabel, Box, Typography, Chip, ToggleButton, ToggleButtonGroup,
  Alert, LinearProgress, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
} from '@mui/material';
import { useApp, generateId } from '@/store/appStore';
import type { Character } from '@/types/character';
import { generateSystemPrompt, type ProgressCallback } from '@/utils/voiceExtractor';

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
  const [sampleSide, setSampleSide] = useState<'monologue' | 'left' | 'right'>('monologue');
  const [knowledge, setKnowledge] = useState('');
  const [firstMsg, setFirstMsg] = useState('');
  const [avatar, setAvatar] = useState('🤖');

  const [genProgress, setGenProgress] = useState({ step: 0, label: '', checked: [false, false, false] });

  const steps = ['基本信息', '说话风格', '贴原话', '专业知识', '示例对话'];

  const toggleArray = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const handleGenerate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setGenProgress({ step: 0, label: '准备中...', checked: [false, false, false] });

    const onProgress: ProgressCallback = (step, label) => {
      setGenProgress(prev => ({
        step,
        label,
        checked: prev.checked.map((c, i) => i < step ? true : c),
      }));
    };

    const systemPrompt = await generateSystemPrompt({
      name: name.trim(),
      description: description.trim(),
      tone,
      catchphrases: catchphrases.filter(Boolean),
      style,
      topics,
      avoid: avoid.trim(),
      knowledge: knowledge.trim(),
      firstMsg: firstMsg.trim(),
      rawSamples: samples.trim(),
      sampleSide,
    }, onProgress);

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
            <Alert severity="info" sx={{ mb: 1 }}>
              最关键的一步！把 ta 说过的原话贴进来，哪怕 3-5 句也很有用。
            </Alert>

            <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>
              💡 <strong>从微信/QQ 导出：</strong><br/>
              · 微信：长按消息 → 多选 → 合并转发给自己 → 复制文字 → 粘贴到下面<br/>
              · QQ：消息管理器 → 右键导出为 .txt → 用记事本打开 → 复制粘贴<br/>
              · 或者在聊天记录里挑 10 句 ta 最常说的话，直接打出来
            </Typography>

            <TextField label="贴 ta 的原话" value={samples} onChange={e => setSamples(e.target.value)}
              fullWidth multiline minRows={6} maxRows={12}
              placeholder={`"哼！我才不是关心你呢！"\n"笨蛋，这点小事都做不好..."\n"你...你回来了啊...还挺想你的..."`} />

            {samples.trim().length > 20 && (
              <FormControl component="fieldset" sx={{ mt: 1 }}>
                <FormLabel component="legend" sx={{ fontSize: 13, mb: 1 }}>
                  如果贴的是和 ta 的聊天记录，告诉 AI 哪边是 ta：
                </FormLabel>
                <RadioGroup value={sampleSide} onChange={e => setSampleSide(e.target.value as typeof sampleSide)}>
                  <FormControlLabel value="monologue" control={<Radio size="small" />} label="只贴了 ta 单边说的话（最理想！不用分析）" />
                  <FormControlLabel value="right" control={<Radio size="small" />} label="左边是我，右边是 ta" />
                  <FormControlLabel value="left" control={<Radio size="small" />} label="左边是 ta，右边是我" />
                </RadioGroup>
              </FormControl>
            )}
          </Box>
        )}

        {/* Step 3: 专业知识 */}
        {step === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>选填。如果只是聊天陪伴，跳过这步。如果你想让 ta 有专业知识（如法考老师、医生），把相关资料贴进来。</Alert>
            <TextField label="专业知识材料" value={knowledge} onChange={e => setKnowledge(e.target.value)} fullWidth multiline minRows={5} maxRows={10} placeholder="粘贴文章、笔记、教材片段..." />
          </Box>
        )}

        {/* Step 4: 开场白 + 生成 */}
        {step === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              写一句 ta 的开场白。用户第一次跟 ta 聊天时，ta 会主动说这句。
            </Alert>
            <TextField label="ta 的开场白" value={firstMsg} onChange={e => setFirstMsg(e.target.value)}
              fullWidth multiline minRows={2}
              placeholder="桐人君，你终于来了！/ 哎呀妈呀，可算来人了！/ 查询已接收。请描述你的需求。" />

            {loading && (
              <Box sx={{ mt: 2 }}>
                {[1, 2, 3].map(i => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontSize: 13 }}>
                    {genProgress.checked[i-1] ? (
                      <Box component="span" sx={{ color: 'success.main' }}>✓</Box>
                    ) : genProgress.step === i ? (
                      <Box component="span" sx={{ color: 'primary.main', animation: 'pulse 1.5s ease-in-out infinite' }}>○</Box>
                    ) : (
                      <Box component="span" sx={{ color: 'text.disabled' }}>○</Box>
                    )}
                    <Typography variant="body2" color={genProgress.step >= i ? 'text.primary' : 'text.disabled'}>
                      {i === 1 ? '分析 ta 的说话方式...' : i === 2 ? '生成示例对话...' : '构建角色...'}
                    </Typography>
                  </Box>
                ))}
                <LinearProgress sx={{ mt: 1, borderRadius: 1, height: 4 }} />
              </Box>
            )}
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
