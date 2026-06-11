// 聊天输入框

import { useState, useRef } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#fff', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
      <TextField
        inputRef={inputRef}
        multiline maxRows={4} fullWidth size="small"
        value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
        }}
        placeholder={isStreaming ? '回复中...' : '输入消息，Enter 发送，Shift+Enter 换行'}
        disabled={isStreaming}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
      />
      <IconButton
        onClick={isStreaming ? onStop : handleSend}
        color="primary"
        sx={{ width: 40, height: 40, bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, color: '#fff', borderRadius: 2 }}
      >
        {isStreaming ? <StopIcon /> : <SendIcon />}
      </IconButton>
    </Box>
  );
}
