// 角色卡片

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { Character } from '@/types/character';

interface Props {
  character: Character;
  onClick: () => void;
  compact?: boolean;
}

export function CharacterCard({ character, onClick, compact }: Props) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer', borderRadius: 3, transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
        height: compact ? 140 : 180,
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2.5, px: 1.5 }}>
        <Box sx={{ fontSize: compact ? 32 : 44, mb: 0.8 }}>{character.avatar}</Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.3, textAlign: 'center', fontSize: 13 }}>
          {character.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{
          textAlign: 'center', px: 0.5, overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: 1.3, minHeight: compact ? '2.6em' : 'auto',
        }}>
          {character.description}
        </Typography>
        {!compact && character.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {character.tags.slice(0, 2).map(t => (
              <Box key={t} sx={{ fontSize: 10, px: 1, py: 0.3, borderRadius: 4, bgcolor: 'rgba(79,70,229,0.08)', color: '#4F46E5' }}>{t}</Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
