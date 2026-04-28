import React from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, List, ListItem, ListItemText } from '@mui/material';

const SettingsPage = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Settings
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Account Preferences
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Notification Preferences" secondary="Configure alert and notification delivery." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Theme" secondary="Switch between light and dark mode." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Language" secondary="Set your preferred language and locale." />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Security Settings
              </Typography>
              <Box sx={{ color: 'text.secondary' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Change your password, enable multi-factor authentication, and review recent login activity.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  These settings help protect your account and keep access secure.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SettingsPage;
