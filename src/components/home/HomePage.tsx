// 首页

import { useState } from 'react';
import { Box, Typography, Button, Grid, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { TEMPLATES, type Character, createEmptyCharacter } from '@/types/character';
import { useApp, generateId } from '@/store/appStore';
import { CharacterCard } from './CharacterCard';
import { CreateWizard } from './CreateWizard';
import { downloadCharacterJSON, downloadSkillMD } from '@/utils/skillExport';

export function HomePage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuChar, setMenuChar] = useState<Character | null>(null);

  const handleSelectChar = (id: string) => {
    dispatch({ type: 'SET_ACTIVE', payload: id });
    navigate('/chat');
  };

  const handleSelectTemplate = (tplIdx: number) => {
    const tpl = TEMPLATES[tplIdx];
    if (!tpl) return;
    // 用模板数据直接生成角色 → 立刻进入聊天
    const prompt = buildPromptFromTemplate(tpl);
    const char: Character = {
      ...tpl,
      id: generateId(),
      systemPrompt: prompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      firstMessage: tpl.firstMessage || `你好，我是${tpl.name}。`,
    };
    dispatch({ type: 'ADD_CHARACTER', payload: char });
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

      {/* 预设模板 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>试试这些模板</Typography>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setWizardOpen(true)}>
          创建新角色
        </Button>
      </Box>
      <Grid container spacing={2}>
        {templates.map((tpl, i) => (
          <Grid item xs={6} sm={4} md={2.4} key={tpl.id}>
            <CharacterCard character={tpl} onClick={() => handleSelectTemplate(i)} compact />
          </Grid>
        ))}
      </Grid>

      {/* 创建向导弹窗 */}
      <CreateWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

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

function buildPromptFromTemplate(tpl: Character): string {
  const parts = [
    `你是${tpl.name}。${tpl.description}。永远以${tpl.name}的身份说话，不跳出角色。`,
  ];
  if (tpl.tone.length) parts.push(`说话语气：${tpl.tone.join('、')}。`);
  if (tpl.catchphrases.length) parts.push(`常用口头禅：${tpl.catchphrases.join('、')}。`);
  if (tpl.style.length) parts.push(`说话特点：${tpl.style.join('、')}。`);
  if (tpl.topics.length) parts.push(`喜欢的聊天话题：${tpl.topics.join('、')}。`);
  if (tpl.avoid) parts.push(`绝对不做或不说：${tpl.avoid}。`);
  parts.push('你就是这个角色。用角色的语气回答，不要加任何解释。');
  return parts.join('\n\n');
}
