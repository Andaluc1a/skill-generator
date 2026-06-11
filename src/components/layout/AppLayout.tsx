// ================================================================
// AppLayout — WorkBuddy 风格布局
// ================================================================

import { Box, useTheme } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const NAV_ITEMS = [
  { path: '/', icon: HomeIcon, label: '首页' },
  { path: '/settings', icon: SettingsIcon, label: '设置' },
];

export function AppLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f8fafc' }}>
      {/* 深色侧边栏 */}
      <Box sx={{
        width: 60, bgcolor: '#1e1e2e', display: 'flex', flexDirection: 'column',
        alignItems: 'center', py: 2, gap: 2,
      }}>
        <Box sx={{ color: '#f59e0b', fontSize: 24, fontWeight: 800, mb: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <AutoAwesomeIcon />
        </Box>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <Box key={item.path} onClick={() => navigate(item.path)} sx={{
              width: 42, height: 42, borderRadius: 2, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              bgcolor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
              transition: 'all 0.15s',
            }} title={item.label}>
              <item.icon fontSize="small" />
            </Box>
          );
        })}
      </Box>
      {/* 主区域 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
