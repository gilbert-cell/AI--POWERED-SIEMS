import React, { useState } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, CircularProgress, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Slider, Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { formatDateTime } from '../../utils/helpers';

const ModelsTab = ({ models, loading, onSaveWeights }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [weights, setWeights] = useState({});

  const handleEdit = (model) => {
    setSelectedModel(model);
    setWeights(model.weights || {});
    setEditOpen(true);
  };

  const handleSave = () => {
    onSaveWeights(selectedModel.id, weights, () => setEditOpen(false));
  };

  return (
    <Box>
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    {['Model Name', 'Type', 'Status', 'Accuracy', 'Last Updated', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.length > 0 ? models.map((model) => (
                    <TableRow key={model.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{model.name}</Typography>
                        <Typography variant="caption" color="textSecondary">Version: {model.version}</Typography>
                      </TableCell>
                      <TableCell>{model.model_type}</TableCell>
                      <TableCell>
                        <Chip label={model.is_active ? 'Active' : 'Inactive'}
                          color={model.is_active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 60, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${model.accuracy || 0}%`, backgroundColor: model.accuracy > 80 ? '#388e3c' : '#f57c00' }} />
                          </Box>
                          <Typography variant="body2">{model.accuracy}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(model.last_updated)}
                      </TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(model)} sx={{ color: '#1a237e' }}>
                          Tune
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>No AI models available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>
          Tune Model: {selectedModel?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">Adjust model weights to fine-tune detection sensitivity and accuracy.</Alert>
          {selectedModel?.weights && Object.entries(selectedModel.weights).map(([key, value]) => (
            <Box key={key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{key}</Typography>
                <Typography variant="body2">{weights[key] ?? value}</Typography>
              </Box>
              <Slider value={weights[key] ?? value}
                onChange={(_, v) => setWeights(prev => ({ ...prev, [key]: v }))}
                min={0} max={1} step={0.1} />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#1a237e' }}>Save Weights</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelsTab;
