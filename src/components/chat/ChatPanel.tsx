// ================================================================
// ChatPanel — 聊天主面板
// ================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/DeleteSweep';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/appStore';
import { streamChat, tweakPersona } from '@/utils/personaTweaker';
import { extractKnowledge, matchKnowledge, formatKnowledgePrompt, type KnowledgeEntry } from '@/utils/knowledgeExtractor';
import { parseSamplePairs, findRelevantSamples, formatSamplePrompt } from '@/utils/sampleMemory';
import { DEFAULT_API_CONFIG, type ChatMessage, type ApiConfig } from '@/llm';
import { encodeBase64, decodeBase64, getStorage, setStorage } from '@/utils/storage';
import { ChatMessage as ChatBubble } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { PersonaCard } from './PersonaCard';
import { TweakDialog } from './TweakDialog';

const CHAT_PREFIX = 'sg_chat_';
const KNOWLEDGE_PREFIX = 'sg_knowledge_';

function loadMessages(charId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + charId);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMessages(charId: string, msgs: ChatMessage[]) {
  try { localStorage.setItem(CHAT_PREFIX + charId, JSON.stringify(msgs)); } catch { /* ignore */ }
}

function clearMessages(charId: string) {
  localStorage.removeItem(CHAT_PREFIX + charId);
}

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
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>(() =>
    getStorage<KnowledgeEntry[]>(KNOWLEDGE_PREFIX + char?.id, []),
  );

  useEffect(() => { promptRef.current = char?.systemPrompt || ''; }, [char?.systemPrompt]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText]);

  // 首次加载：从 localStorage 恢复聊天记录，否则发开场白
  useEffect(() => {
    if (!char) return;
    const saved = loadMessages(char.id);
    if (saved.length > 0) {
      setMessages(saved);
    } else if (char.firstMessage) {
      const firstMsg: ChatMessage = { role: 'assistant', content: char.firstMessage };
      setMessages([firstMsg]);
      saveMessages(char.id, [firstMsg]);
    }
    // 自动提取知识库
    const savedKw = getStorage<KnowledgeEntry[]>(KNOWLEDGE_PREFIX + char.id, []);
    setKnowledgeEntries(savedKw);
    if (char.knowledge && char.knowledge.trim().length > 20 && savedKw.length === 0) {
      const config = getConfig();
      if (config) {
        extractKnowledge(char.knowledge, config).then(entries => {
          setKnowledgeEntries(entries);
          setStorage(KNOWLEDGE_PREFIX + char.id, entries);
        }).catch(() => {});
      }
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
    // 注入匹配的知识条目
    const matched = matchKnowledge(text, knowledgeEntries);
    if (matched.length > 0) {
      sysMsg.content = promptRef.current + '\n\n' + formatKnowledgePrompt(matched);
    }
    // 注入相关原话样本（如果角色有 sample 数据）
    if (char?.samples?.trim()) {
      const pairs = parseSamplePairs(char.samples, 'monologue');
      const relevant = findRelevantSamples(text, pairs);
      if (relevant.length > 0) {
        sysMsg.content = (sysMsg.content as string) + '\n\n' + formatSamplePrompt(relevant, char.name);
      }
    }
    setIsStreaming(true);

    try {
      const reply = await streamChat([sysMsg, ...newMsgs], config, ctrl.signal);
      if (!ctrl.signal.aborted) {
        const finalMsgs: ChatMessage[] = [...newMsgs, { role: 'assistant' as const, content: reply }];
        setMessages(finalMsgs);
        if (char) saveMessages(char.id, finalMsgs);
        setStreamingText('');
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        const finalMsgs: ChatMessage[] = [...newMsgs, { role: 'assistant' as const, content: `出错了：${err instanceof Error ? err.message : '对话失败'}。请检查 API Key 配置或网络连接。` }];
        setMessages(finalMsgs);
        if (char) saveMessages(char.id, finalMsgs);
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

  const handleDirectEdit = (newPrompt: string) => {
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
        <IconButton size="small" onClick={() => { clearMessages(char.id); setMessages([]); }} title="清空聊天记录">
          <DeleteIcon fontSize="small" />
        </IconButton>
        <Button
          variant="outlined"
          size="small"
          startIcon={<TuneIcon />}
          onClick={() => setTweakOpen(true)}
          sx={{ ml: 0.5, borderRadius: 2, textTransform: 'none', fontSize: 12, py: 0.5 }}
        >
          微调角色
        </Button>
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
      <TweakDialog open={tweakOpen} onClose={() => setTweakOpen(false)} character={char} onApply={handleTweak} onDirectEdit={handleDirectEdit} />
    </Box>
  );
}
