// 角色卡 — 聊天侧边显示当前角色完整信息

import { Box, Typography, Chip, Tooltip } from '@mui/material';
import type { Character } from '@/types/character';

interface Props {
  character: Character;
}

export function PersonaCard({ character }: Props) {
  const allTags = [
    ...(character.tone || []).map(t => ({ label: t, color: '#4F46E5' })),
    ...(character.catchphrases || []).filter(Boolean).map(c => ({ label: c, color: '#F59E0B' })),
    ...(character.style || []).slice(0, 2).map(s => ({ label: s, color: '#10B981' })),
  ].slice(0, 4);

  return (
    <Box sx={{ px: 2, py: 1.2, borderBottom: 1, borderColor: 'divider', bgcolor: '#fafbff', flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <Box sx={{ fontSize: 28, flexShrink: 0 }}>{character.avatar}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, fontSize: 14 }}>
            {character.name}
          </Typography>
          <Tooltip title={character.avoid || ''} arrow>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {character.catchphrases?.[0] ? `「${character.catchphrases[0]}」` : character.description.slice(0, 25)}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
      {allTags.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.8 }}>
          {allTags.map(t => (
            <Chip key={t.label} label={t.label} size="small"
              sx={{ fontSize: 10, height: 20, bgcolor: t.color + '14', color: t.color, fontWeight: 500 }} />
          ))}
        </Box>
      )}
    </Box>
  );
}
