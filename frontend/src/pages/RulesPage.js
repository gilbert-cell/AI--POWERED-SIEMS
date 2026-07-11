import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import RulesTab from '../components/Rules/RulesTab';
import ThresholdsTab from '../components/Rules/ThresholdsTab';

const TABS = [{ key: 'rules', label: 'Detection Rules' }, { key: 'thresholds', label: 'Alert Thresholds' }];

const RulesPage = () => {
  const [activeTab, setActiveTab] = useState('rules');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>Rules & Thresholds</Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {TABS.map(({ key, label }) => (
          <Button key={key} variant={activeTab === key ? 'contained' : 'outlined'} onClick={() => setActiveTab(key)}
            sx={{ backgroundColor: activeTab === key ? '#1a237e' : 'transparent', color: activeTab === key ? 'white' : '#1a237e', borderColor: '#1a237e', '&:hover': { backgroundColor: activeTab === key ? '#283593' : '#e8eaf6' } }}>
            {label}
          </Button>
        ))}
      </Box>

      {activeTab === 'rules' ? <RulesTab /> : <ThresholdsTab />}
    </Container>
  );
};

export default RulesPage;
