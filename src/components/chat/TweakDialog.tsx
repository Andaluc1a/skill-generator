// 分区式微调弹窗 — V2 升级版

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Box, Typography, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
  Chip, IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { Character, PromptParts } from '@/types/character';
import { parsePromptParts } from '@/types/character';

interface Props {
  open: boolean;
  onClose: () => void;
  character: Character;
  onApply: (feedback: string) => Promise<void>;
  onDirectEdit: (newPrompt: string) => void;
}

export function TweakDialog({ open, onClose, character, onApply, onDirectEdit }: Props) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawEdit, setRawEdit] = useState(false);
  const [rawPrompt, setRawPrompt] = useState(character.systemPrompt);

  const parts: PromptParts = character.promptParts || parsePromptParts(character.systemPrompt);

  const handleApply = async () => {
    if (!feedback.trim() || loading) return;
    setLoading(true);
    try {
      await onApply(feedback.trim());
      setFeedback('');
      setRawPrompt(''); // force refresh
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRawSave = () => {
    if (rawPrompt.trim()) {
      onDirectEdit(rawPrompt.trim());
      onClose();
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(character.systemPrompt);
  };

  const sections: { key: keyof PromptParts; label: string; emoji: string; color: string }[] = [
    { key: 'identity', label: '角色身份', emoji: '👤', color: '#4F46E5' },
    { key: 'voice', label: '说话风格', emoji: '🎙️', color: '#F59E0B' },
    { key: 'rules', label: '行为准则', emoji: '📏', color: '#EF4444' },
    { key: 'samples', label: '示例对话', emoji: '💬', color: '#10B981' },
    { key: 'knowledge', label: '知识储备', emoji: '📚', color: '#8B5CF6' },
  ];

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TuneIcon color="primary" />
        微调「{character.name}」
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={copyPrompt} title="复制 System Prompt"><ContentCopyIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {/* 分区卡片 */}
        {!rawEdit && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              当前角色的 System Prompt 拆分为以下区域：
            </Typography>
            {sections.map(s => {
              const content = parts[s.key];
              if (!content) return null;
              return (
                <Accordion key={s.key} defaultExpanded={s.key === 'identity' || s.key === 'voice'}
                  sx={{ mb: 0.5, '&:before': { display: 'none' }, borderRadius: 2, overflow: 'hidden' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ fontSize: 16 }}>{s.emoji}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                      <Chip size="small" label={content.split('\n').length + ' 行'} sx={{ ml: 1, height: 18, fontSize: 10 }} />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'text.secondary', fontFamily: 'monospace', bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                      {content}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <Button size="small" variant="text" onClick={() => { setRawPrompt(character.systemPrompt); setRawEdit(true); }}
              sx={{ mt: 1, fontSize: 12, textTransform: 'none' }}>
              查看/编辑原始 Prompt
            </Button>

            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>大白话微调</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                不想手动改？直接用大白话描述想要的变化：
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2, color: 'text.secondary', fontSize: 12 }}>
                <li>"语气太重了，温和一点"</li>
                <li>"太啰嗦了，每句不超过30个字"</li>
                <li>"加点幽默感"</li>
              </Box>
              <TextField
                multiline minRows={2} maxRows={4} fullWidth
                disabled={loading}
                placeholder="描述你想怎么调整..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleApply(); } }}
                size="small"
              />
            </Box>
          </>
        )}

        {/* 原始编辑模式 */}
        {rawEdit && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button size="small" variant="text" onClick={() => setRawEdit(false)}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>← 回到分区视图</Button>
            <TextField label="System Prompt（可直接编辑）" value={rawPrompt}
              onChange={e => setRawPrompt(e.target.value)}
              fullWidth multiline minRows={10} maxRows={20}
              sx={{ fontFamily: 'monospace', fontSize: 12 }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!loading && <Button onClick={onClose} color="inherit">取消</Button>}
        {rawEdit ? (
          <Button onClick={handleRawSave} variant="contained" color="primary">保存 Prompt</Button>
        ) : (
          <Button onClick={handleApply} variant="contained" disabled={!feedback.trim() || loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}>
            {loading ? '调整中...' : '应用调整'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
