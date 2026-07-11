import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:   { main: '#1a237e', light: '#534bae', dark: '#000051' },
    secondary: { main: '#d32f2f', light: '#ff6659', dark: '#9a0007' },
    success:   { main: '#388e3c' },
    warning:   { main: '#f57c00' },
    info:      { main: '#1565c0' },
    background:{ default: '#fafafa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 700 } },
    },
  },
});

export default theme;
