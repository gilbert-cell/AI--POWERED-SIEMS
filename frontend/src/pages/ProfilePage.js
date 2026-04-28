import React from 'react';
import { Box, Container, Typography, Card, CardContent, Avatar, Grid } from '@mui/material';

const ProfilePage = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Profile
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: '#42a5f5' }}>AD</Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Admin User
                </Typography>
                <Typography color="textSecondary">Security Operations</Typography>
              </Box>
            </Box>
            <CardContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Email: admin@example.com
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Role: Security Analyst
              </Typography>
              <Typography variant="body1">
                Last Login: 2026-04-25 09:40 UTC
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Account Overview
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Manage your profile settings, view your permissions, and ensure your account details are up to date.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
