// SKILL.md 导出工具

import type { Character } from '@/types/character';

export function exportSkillMD(character: Character): string {
  const parts = character.promptParts || { identity: '', voice: '', rules: '', samples: '', knowledge: '' };

  return `---
name: ${slugify(character.name)}
description: ${character.description}
avatar: ${character.avatar}
tags: [${character.tags.join(', ')}]
tone: [${character.tone.join(', ')}]
catchphrases: [${character.catchphrases.filter(Boolean).join(', ')}]
---

# ${character.name}

## 角色身份
${parts.identity || `你是${character.name}。${character.description}`}

## 说话风格
${parts.voice || character.tone.join('、') + '。'}

## 行为准则
${parts.rules || character.avoid || '无特殊限制。'}

${parts.samples ? `## 示例对话\n${parts.samples}\n` : ''}${parts.knowledge ? `## 知识范围\n${parts.knowledge}\n` : ''}
## 完整 System Prompt
\`\`\`
${character.systemPrompt}
\`\`\`
`;
}

export function downloadSkillMD(character: Character) {
  const content = exportSkillMD(character);
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skill-${slugify(character.name)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCharacterJSON(char: Character): string {
  return JSON.stringify(char, null, 2);
}

export function downloadCharacterJSON(char: Character) {
  const content = exportCharacterJSON(char);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `character-${slugify(char.name)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importCharacterJSON(json: string): Character | null {
  try {
    const obj = JSON.parse(json);
    if (!obj.name || !obj.systemPrompt) return null;
    return obj as Character;
  } catch {
    return null;
  }
}

function slugify(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || name;
}
