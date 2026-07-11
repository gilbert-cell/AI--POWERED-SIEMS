import React from 'react';
import { Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProgressBar from '../shared/ProgressBar';

const TopHostsSection = ({ topHosts }) => {
  const total = topHosts.reduce((s, h) => s + h.event_count, 0);

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Top Hosts by Event Count</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topHosts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="host" type="category" width={90} tick={{ fontSize: 14 }} />
                <Tooltip />
                <Bar dataKey="event_count" fill="#1a237e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Host Breakdown</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    {['#', 'Host', 'Events', 'Share'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 'bold', fontSize: 15 }} align={h === 'Events' || h === 'Share' ? 'right' : 'left'}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topHosts.map((h, i) => {
                    const pct = total ? (h.event_count / total) * 100 : 0;
                    return (
                      <TableRow key={h.host} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{h.host}</TableCell>
                        <TableCell align="right">{h.event_count}</TableCell>
                        <TableCell align="right">
                          <ProgressBar value={pct} color="#1a237e" width={50} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TopHostsSection;
