// 大白话微调角色弹窗

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, CircularProgress } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (feedback: string) => Promise<void>;
}

export function TweakDialog({ open, onClose, onApply }: Props) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!feedback.trim() || loading) return;
    setLoading(true);
    try {
      await onApply(feedback.trim());
      setFeedback('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TuneIcon color="primary" /> 微调角色风格
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          用大白话告诉 AI 你想怎么调整。比如：
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2, color: 'text.secondary', fontSize: 13 }}>
          <li>"语气太重了，温和一点，像长辈而不是领导"</li>
          <li>"太啰嗦了，别超过30个字"</li>
          <li>"多点幽默感，用生活化的比喻"</li>
          <li>"不要总是反问，直接给建议"</li>
        </Box>
        <TextField
          multiline minRows={3} maxRows={6} fullWidth autoFocus
          disabled={loading}
          placeholder="描述你想怎么调整..."
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleApply(); } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!loading && <Button onClick={onClose} color="inherit">取消</Button>}
        <Button onClick={handleApply} variant="contained" disabled={!feedback.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}>
          {loading ? '调整中...' : '应用调整'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
