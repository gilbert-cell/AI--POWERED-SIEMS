import React from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress } from '@mui/material';

const METRICS = ['Overall Accuracy', 'Precision', 'Recall', 'F1 Score'];
const METRIC_KEYS = ['overall_accuracy', 'precision', 'recall', 'f1_score'];

const CONFUSION = [
  { label: 'True Positives',  key: 'true_positives',  bg: '#e8f5e9', color: '#388e3c' },
  { label: 'False Positives', key: 'false_positives', bg: '#ffebee', color: '#d32f2f' },
  { label: 'False Negatives', key: 'false_negatives', bg: '#fff3e0', color: '#f57c00' },
  { label: 'True Negatives',  key: 'true_negatives',  bg: '#f3e5f5', color: '#7b1fa2' },
];

const AccuracyTab = ({ accuracy, loading, lastUpdated }) => {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;

  if (!accuracy) return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Typography color="textSecondary">No accuracy metrics available</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Overall Accuracy Metrics</Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="textSecondary" display="block">
                  {accuracy.total_logs_analyzed?.toLocaleString() ?? 0} logs analyzed
                </Typography>
                <Typography variant="caption" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                  ⟳ Live · Updated {lastUpdated}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {METRICS.map((label, i) => {
                const val = accuracy[METRIC_KEYS[i]];
                return (
                  <Box key={label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{label}</Typography>
                      <Typography variant="body2">{val}%</Typography>
                    </Box>
                    <Box sx={{ height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${val || 0}%`, backgroundColor: i === 0 ? '#388e3c' : '#1a237e', transition: 'width 0.6s ease' }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Confusion Matrix</Typography>
            <Grid container spacing={2}>
              {CONFUSION.map(({ label, key, bg, color }) => (
                <Grid item xs={6} key={label}>
                  <Box sx={{ p: 2, backgroundColor: bg, borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="textSecondary">{label}</Typography>
                    <Typography variant="h5" sx={{ color, fontWeight: 'bold', transition: 'all 0.4s' }}>
                      {accuracy[key]?.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AccuracyTab;
