import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from '@/store/appStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Home } from '@/routes/Home';
import { Chat } from '@/routes/Chat';
import { Settings } from '@/routes/Settings';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4F46E5' },
    secondary: { main: '#F59E0B' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '/chat', element: <Chat /> },
]);

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ThemeProvider>
  );
}
