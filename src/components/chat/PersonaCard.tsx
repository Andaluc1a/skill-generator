// 角色卡 — 聊天侧边显示当前角色信息

import { Box, Typography, Chip } from '@mui/material';
import type { Character } from '@/types/character';

interface Props {
  character: Character;
}

export function PersonaCard({ character }: Props) {
  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: '#fafbff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ fontSize: 24 }}>{character.avatar}</Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{character.name}</Typography>
          <Typography variant="caption" color="text.secondary">{character.description.slice(0, 20)}</Typography>
        </Box>
      </Box>
      {character.tone.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {character.tone.slice(0, 3).map(t => (
            <Chip key={t} label={t} size="small" sx={{ fontSize: 10, height: 20 }} />
          ))}
        </Box>
      )}
    </Box>
  );
}
