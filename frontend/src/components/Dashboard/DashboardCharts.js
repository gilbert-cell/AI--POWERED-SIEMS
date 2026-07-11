import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#1a237e', '#d32f2f', '#f57c00', '#388e3c', '#7b1fa2'];

const DashboardCharts = ({ topAlerts }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Top Alert Types</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={topAlerts} dataKey="count" nameKey="alert_type" cx="50%" cy="50%" outerRadius={80} label>
                {topAlerts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % 5]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

export default DashboardCharts;
