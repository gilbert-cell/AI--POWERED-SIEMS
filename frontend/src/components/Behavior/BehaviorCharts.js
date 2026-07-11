import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BehaviorCharts = ({ analysis }) => (
  <Grid container spacing={3} sx={{ mb: 4 }}>
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Behavioral Pattern Over Time</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysis?.pattern_data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#666" /><YAxis stroke="#666" />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="baseline" stroke="#388e3c" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#d32f2f" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Anomaly Distribution by Type</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis?.anomaly_types || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" stroke="#666" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#666" /><Tooltip />
              <Bar dataKey="count" fill="#1a237e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

export default BehaviorCharts;
