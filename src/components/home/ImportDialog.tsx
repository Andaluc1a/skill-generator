// 角色导入弹窗

import { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Alert,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import type { Character } from '@/types/character';
import { useApp, generateId } from '@/store/appStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: Props) {
  const { dispatch } = useApp();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError('');
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;

        // 尝试解析 JSON
        const obj = JSON.parse(text);
        if (!obj.name || !obj.systemPrompt) {
          setError('角色数据不完整，缺少 name 或 systemPrompt');
          return;
        }
        const char: Character = {
          ...obj,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        dispatch({ type: 'ADD_CHARACTER', payload: char });
        setSuccess(true);
        setTimeout(() => { onClose(); setSuccess(false); }, 1200);
      } catch {
        // 不是 JSON，可能是 PNG 角色卡
        if (file.name.endsWith('.png')) {
          setError('PNG 角色卡解析需要额外处理。请解压后用 JSON 导入。');
        } else {
          setError('文件格式不支持。请使用 JSON 格式。');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>导入角色</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>导入成功！</Alert>}

        <Box
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          sx={{
            border: '2px dashed', borderColor: dragging ? 'primary.main' : 'grey.300',
            borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer',
            bgcolor: dragging ? 'primary.50' : 'grey.50',
            transition: 'all 0.2s',
          }}
        >
          <FileUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            拖入角色文件或点击选择
          </Typography>
          <Typography variant="body2" color="text.secondary">
            支持 JSON 格式的角色卡
          </Typography>
        </Box>
        <input ref={fileRef} type="file" accept=".json,.png" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
      </DialogActions>
    </Dialog>
  );
}
