// API Key 设置页

import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Card, CardContent, Slider,
  ToggleButtonGroup, ToggleButton, Alert, IconButton, InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/appStore';
import { DEFAULT_API_CONFIG } from '@/llm';
import { encodeBase64 } from '@/utils/storage';
import { OpenAICompatibleProvider } from '@/llm';

type Provider = 'deepseek' | 'openai' | 'qwen' | 'grok' | 'custom';

const PROVIDERS: Record<Provider, { label: string; url: string; model: string }> = {
  deepseek: { label: 'DeepSeek', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  openai: { label: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o' },
  qwen: { label: 'Qwen (通义千问)', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  grok: { label: 'Grok (xAI)', url: 'https://api.x.ai/v1', model: 'grok-beta' },
  custom: { label: '自定义', url: '', model: '' },
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [showKey, setShowKey] = useState(false);

  // 从 localStorage 读取已有配置
  const loadConfig = () => {
    try {
      const raw = localStorage.getItem('sg_api_config');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  };

  const stored = loadConfig();
  const [provider, setProvider] = useState<Provider>((stored?.provider as Provider) || 'deepseek');
  const [model, setModel] = useState(stored?.model || 'deepseek-chat');
  const [baseURL, setBaseURL] = useState(stored?.baseURL || 'https://api.deepseek.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(stored?.temperature ?? 0.8);
  const [maxTokens, setMaxTokens] = useState(stored?.maxTokens ?? 4096);

  const handleProviderChange = (_: unknown, val: Provider) => {
    if (!val) return;
    setProvider(val);
    if (val !== 'custom') {
      setBaseURL(PROVIDERS[val].url);
      setModel(PROVIDERS[val].model);
    }
  };

  const handleSave = () => {
    const config = { provider, model, baseURL, apiKey: encodeBase64(apiKey), temperature, maxTokens };
    localStorage.setItem('sg_api_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult('idle');
    try {
      const provider = new OpenAICompatibleProvider(
        { provider: 'custom', model, baseURL, apiKey, temperature: 0, maxTokens: 10 },
      );
      let hasContent = false;
      for await (const chunk of provider.chat([{ role: 'user', content: 'Hi' }], undefined, { temperature: 0, maxTokens: 10 })) {
        if (chunk.type === 'delta') hasContent = true;
        if (chunk.type === 'done') break;
        if (chunk.type === 'error') throw new Error(chunk.message);
      }
      setTestResult(hasContent ? 'success' : 'fail');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: 4, maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>API 配置</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        配置你的 LLM API。Key 只存在你浏览器本地，不会上传到任何服务器。
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>模型提供商</Typography>
            <ToggleButtonGroup value={provider} exclusive onChange={handleProviderChange} size="small">
              {Object.entries(PROVIDERS).map(([k, v]) => (
                <ToggleButton key={k} value={k} sx={{ px: 2 }}>{v.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <TextField label="模型名称" value={model} onChange={e => setModel(e.target.value)} fullWidth size="small" helperText="如 deepseek-chat / gpt-4o / qwen-plus" />
          <TextField label="Base URL" value={baseURL} onChange={e => setBaseURL(e.target.value)} fullWidth size="small" />
          <TextField
            label="API Key" type={showKey ? 'text' : 'password'} value={apiKey}
            onChange={e => setApiKey(e.target.value)} fullWidth size="small"
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowKey(!showKey)}>{showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton>
              </InputAdornment>
            )}}
          />

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Temperature: {temperature}</Typography>
            <Slider value={temperature} onChange={(_, v) => setTemperature(v as number)} min={0} max={2} step={0.1} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Max Tokens: {maxTokens}</Typography>
            <Slider value={maxTokens} onChange={(_, v) => setMaxTokens(v as number)} min={256} max={8192} step={256} />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="outlined" onClick={handleTest} disabled={testing || !apiKey} startIcon={testResult === 'success' ? <CheckCircleIcon color="success" /> : undefined}>
          {testing ? '验证中...' : testResult === 'success' ? '连接成功' : testResult === 'fail' ? '连接失败' : '验证连接'}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!apiKey}>
          {saved ? '已保存 ✅' : '保存'}
        </Button>
      </Box>

      <Alert severity="info" sx={{ fontSize: 13 }}>
        ⚠️ API Key 仅存储在浏览器 localStorage 中，用于向所选 LLM 发送请求。本应用不收集任何数据。
      </Alert>
    </Box>
  );
}
