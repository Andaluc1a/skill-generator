// 首页

import { useState } from 'react';
import { Box, Typography, Button, Grid, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { TEMPLATES, type Character, createEmptyCharacter } from '@/types/character';
import { useApp, generateId } from '@/store/appStore';
import { CharacterCard } from './CharacterCard';
import { CreateWizard } from './CreateWizard';
import { ImportDialog } from './ImportDialog';
import { downloadCharacterJSON, downloadSkillMD } from '@/utils/skillExport';

export function HomePage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [previewChar, setPreviewChar] = useState<Character | null>(null);
  const [previewIdentity, setPreviewIdentity] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuChar, setMenuChar] = useState<Character | null>(null);

  const handleSelectChar = (id: string) => {
    dispatch({ type: 'SET_ACTIVE', payload: id });
    navigate('/chat');
  };

  const handleSelectTemplate = (tplIdx: number) => {
    const tpl = TEMPLATES[tplIdx];
    if (!tpl) return;
    setPreviewChar(tpl);
    setPreviewIdentity('');
  };

  const handleStartChat = () => {
    if (!previewChar) return;
    const prompt = buildPromptFromTemplate(previewChar, previewIdentity.trim());
    const char: Character = {
      ...previewChar,
      id: generateId(),
      systemPrompt: prompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      firstMessage: previewChar.firstMessage || `你好，我是${previewChar.name}。`,
    };
    dispatch({ type: 'ADD_CHARACTER', payload: char });
    setPreviewChar(null);
    navigate('/chat');
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, char: Character) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuChar(char);
  };

  const handleDelete = () => {
    if (menuChar) dispatch({ type: 'DELETE_CHARACTER', payload: menuChar.id });
    setMenuAnchor(null); setMenuChar(null);
  };

  const handleExport = (format: 'skill' | 'json') => {
    if (!menuChar) return;
    if (format === 'skill') downloadSkillMD(menuChar);
    else downloadCharacterJSON(menuChar);
    setMenuAnchor(null); setMenuChar(null);
  };

  const myChars = state.characters;
  const templates = TEMPLATES;

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* 标题区 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          AI 角色工坊
        </Typography>
        <Typography variant="body1" color="text.secondary">
          用大白话创造你的专属 AI 角色，双击 HTML 就能用，不需要写代码
        </Typography>
      </Box>

      {/* 我的角色 */}
      {myChars.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>我的角色</Typography>
          <Grid container spacing={2} sx={{ mb: 5 }}>
            {myChars.map(c => (
              <Grid item xs={6} sm={4} md={3} key={c.id}>
                <Box sx={{ position: 'relative' }}>
                  <CharacterCard character={c} onClick={() => handleSelectChar(c.id)} />
                  <IconButton size="small" onClick={(e) => handleOpenMenu(e, c)}
                    sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* 预设模板 — 分类展示 */}
      {[
        { label: '二次元', tags: ['二次元'] },
        { label: '生活角色', tags: ['生活', '职场', '长辈'] },
        { label: '创意角色', tags: ['创意', '可爱', '搞笑', '穿越'] },
        { label: '情感陪伴', tags: ['陪伴', '友情', '温暖'] },
      ].map(category => {
        const catTemplates = templates.filter(t => t.tags.some(tag => category.tags.includes(tag)));
        if (catTemplates.length === 0) return null;
        return (
          <Box key={category.label} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {category.label}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {catTemplates.map(tpl => (
                <Grid item xs={6} sm={4} md={2.4} key={tpl.id}>
                  <CharacterCard character={tpl} onClick={() => handleSelectTemplate(templates.indexOf(tpl))} compact />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setWizardOpen(true)}>
          创建新角色
        </Button>
        <Button variant="text" size="small" onClick={() => setImportOpen(true)} sx={{ fontSize: 12, textTransform: 'none' }}>
          导入角色
        </Button>
      </Box>

      {/* 创建向导弹窗 */}
      <CreateWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      {/* 角色预览弹窗 */}
      <Dialog open={!!previewChar} onClose={() => setPreviewChar(null)} maxWidth="xs" fullWidth>
        {previewChar && (
          <>
            <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
              <Box sx={{ fontSize: 48, mb: 1 }}>{previewChar.avatar}</Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{previewChar.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {previewChar.description}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">说话风格</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {[...(previewChar.tone || []), ...(previewChar.catchphrases || []).filter(Boolean)].map(t => (
                    <Chip key={t} label={t} size="small" sx={{ fontSize: 10, height: 20 }} />
                  ))}
                </Box>
              </Box>

              <TextField
                label="你是谁？（选填）"
                value={previewIdentity}
                onChange={e => setPreviewIdentity(e.target.value)}
                fullWidth size="small"
                placeholder="我叫小明，是 ta 的学弟..."
                helperText="告诉 AI 你是谁，它就不会乱猜了"
                sx={{ mb: 2 }}
              />

              <Button variant="contained" fullWidth size="large" onClick={handleStartChat}
                sx={{ borderRadius: 2, py: 1.5, fontSize: 16 }}>
                💬 开始聊天
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* 角色操作菜单 */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => { setMenuAnchor(null); setMenuChar(null); }}>
        <MenuItem onClick={() => handleExport('skill')}>
          <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>导出 SKILL.md</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('json')}>
          <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>导出 JSON</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>删除角色</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

function buildPromptFromTemplate(tpl: Character, identity = ''): string {
  const parts = [
    `你是${tpl.name}。${tpl.description}。永远以${tpl.name}的身份说话，不跳出角色。`,
    identity
      ? `【与你聊天的人】${identity}。你知道ta是谁，用你们日常的关系来称呼和回应ta。`
      : `你的对话对象就是你认识的那个人——你们有你们自己的关系（朋友、同学、学弟妹等），但你不需要帮ta定义身份。如果ta问"我是谁"或类似问题，你应该反问ta或者用你们日常的称呼，而不是替ta编造身份或说ta失忆了。`,
  ];
  if (tpl.tone.length) parts.push(`说话语气：${tpl.tone.join('、')}。`);
  if (tpl.catchphrases.length) parts.push(`常用口头禅：${tpl.catchphrases.join('、')}。`);
  if (tpl.style.length) parts.push(`说话特点：${tpl.style.join('、')}。`);
  if (tpl.topics.length) parts.push(`喜欢的聊天话题：${tpl.topics.join('、')}。`);
  if (tpl.avoid) parts.push(`绝对不做或不说：${tpl.avoid}。`);
  parts.push('你就是这个角色。用角色的语气回答，不要加任何解释。');
  return parts.join('\n\n');
}
