import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2, p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Something went wrong</Typography>
        <Typography color="textSecondary" sx={{ maxWidth: 480, textAlign: 'center' }}>
          {this.state.error?.message || 'An unexpected error occurred in this section.'}
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#1a237e' }} onClick={() => this.setState({ hasError: false, error: null })}>
          Try Again
        </Button>
      </Box>
    );
  }
}

export default ErrorBoundary;
