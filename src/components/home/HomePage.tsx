// 首页

import { useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { TEMPLATES } from '@/types/character';
import { useApp } from '@/store/appStore';
import { CharacterCard } from './CharacterCard';
import { CreateWizard } from './CreateWizard';

export function HomePage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleSelectChar = (id: string) => {
    dispatch({ type: 'SET_ACTIVE', payload: id });
    navigate('/chat');
  };

  const handleSelectTemplate = (tplIdx: number) => {
    // 用模板预填创建向导
    setWizardOpen(true);
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
                <CharacterCard character={c} onClick={() => handleSelectChar(c.id)} />
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
    </Box>
  );
}
