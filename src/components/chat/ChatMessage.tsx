// 聊天气泡

import { Box, Avatar, Typography } from '@mui/material';
import type { ChatMessage as ChatMsg } from '@/llm';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface Props {
  message: ChatMsg;
  avatar?: string;
  name?: string;
  isStreaming?: boolean;
}

function renderContent(content: string): string {
  const raw = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

export function ChatMessage({ message, avatar, name, isStreaming }: Props) {
  const { role, content } = message;
  const text = typeof content === 'string' ? content : '';

  if (role === 'system') return null;
  if (!text && role === 'tool') return null;

  if (role === 'user') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 0.8 }}>
        <Box sx={{
          maxWidth: '75%', bgcolor: '#4F46E5', color: '#fff', borderRadius: 3,
          borderBottomRightRadius: 1, px: 2, py: 1, fontSize: 14, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {text}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, px: 2, py: 0.8 }}>
      <Avatar sx={{ width: 30, height: 30, bgcolor: '#f59e0b', fontSize: 14, flexShrink: 0 }}>
        {avatar || 'AI'}
      </Avatar>
      <Box sx={{ flex: 1, maxWidth: '82%' }}>
        {name && <Typography variant="caption" color="text.secondary" sx={{ mb: 0.3, display: 'block' }}>{name}</Typography>}
        <Box sx={{ bgcolor: 'grey.50', borderRadius: 3, borderTopLeftRadius: 1, px: 2, py: 1 }}>
          <Typography variant="body2" component="div" className="markdown-content"
            sx={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              '& p': { my: 0.3 }, '& ul, & ol': { pl: 2, my: 0.3 } }}
            dangerouslySetInnerHTML={{ __html: renderContent(text) }}
          />
          {isStreaming && (
            <Box component="span" sx={{ display: 'inline-block', width: 6, height: 14, bgcolor: 'text.secondary', ml: 0.5, animation: 'blink 1s step-end infinite' }} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
