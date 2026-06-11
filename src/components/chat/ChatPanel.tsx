// ================================================================
// ChatPanel — 聊天主面板
// ================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/appStore';
import { streamChat, tweakPersona } from '@/utils/personaTweaker';
import { DEFAULT_API_CONFIG, type ChatMessage, type ApiConfig } from '@/llm';
import { encodeBase64, decodeBase64 } from '@/utils/storage';
import { ChatMessage as ChatBubble } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { PersonaCard } from './PersonaCard';
import { TweakDialog } from './TweakDialog';

export function ChatPanel() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const char = state.characters.find(c => c.id === state.activeCharacterId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [tweakOpen, setTweakOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const promptRef = useRef(char?.systemPrompt || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { promptRef.current = char?.systemPrompt || ''; }, [char?.systemPrompt]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText]);

  // 首次加载：发送开场白
  useEffect(() => {
    if (char && messages.length === 0 && char.firstMessage) {
      setMessages([{ role: 'assistant', content: char.firstMessage }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char?.id]);

  const getConfig = useCallback((): ApiConfig | null => {
    const raw = localStorage.getItem('sg_api_config');
    if (!raw) return null;
    try {
      const cfg = JSON.parse(raw);
      cfg.apiKey = decodeBase64(cfg.apiKey);
      return cfg;
    } catch { return null; }
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (streamingRef.current) { abortRef.current?.abort(); }
    streamingRef.current = true;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setStreamingText('');

    const config = getConfig();
    if (!config) {
      setMessages([...newMsgs, { role: 'assistant', content: '请先在设置页面配置 API Key。' }]);
      streamingRef.current = false;
      return;
    }

    const sysMsg: ChatMessage = { role: 'system', content: promptRef.current };
    setIsStreaming(true);

    try {
      const reply = await streamChat([sysMsg, ...newMsgs], config, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setMessages([...newMsgs, { role: 'assistant', content: reply }]);
        setStreamingText('');
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        const errMsg = err instanceof Error ? err.message : '对话失败';
        setMessages([...newMsgs, { role: 'assistant', content: `出错了：${errMsg}。请检查 API Key 配置或网络连接。` }]);
      }
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
      abortRef.current = null;
    }
  }, [messages, getConfig]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    streamingRef.current = false;
  };

  const handleTweak = async (feedback: string) => {
    const config = getConfig();
    if (!config) return;
    const newPrompt = await tweakPersona(promptRef.current, feedback, config);
    promptRef.current = newPrompt;
    if (char) {
      dispatch({ type: 'UPDATE_CHARACTER', payload: { ...char, systemPrompt: newPrompt, updatedAt: Date.now() } });
    }
  };

  if (!char) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">未找到角色，请返回首页选择。</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f8fafc' }}>
      {/* 顶部栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}>
        <IconButton size="small" onClick={() => navigate('/')}><ArrowBackIcon /></IconButton>
        <PersonaCard character={char} />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={() => setTweakOpen(true)} title="微调角色">
          <TuneIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 消息区 */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} avatar={char.avatar} name={msg.role === 'assistant' ? char.name : undefined} />
        ))}
        {isStreaming && streamingText && (
          <ChatBubble message={{ role: 'assistant', content: streamingText }} avatar={char.avatar} name={char.name} isStreaming />
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* 输入框 */}
      <ChatInput onSend={handleSend} onStop={handleStop} isStreaming={isStreaming} />

      {/* 微调弹窗 */}
      <TweakDialog open={tweakOpen} onClose={() => setTweakOpen(false)} onApply={handleTweak} />
    </Box>
  );
}
