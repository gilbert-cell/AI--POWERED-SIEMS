import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';

/**
 * Reusable confirmation dialog component
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'info',
}) => {
  const severityColors = {
    info: '#1a237e',
    warning: '#f57c00',
    error: '#d32f2f',
    success: '#388e3c',
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: severityColors[severity], color: 'white', fontWeight: 'bold' }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} sx={{ color: '#666' }}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{ backgroundColor: severityColors[severity] }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Reusable filter bar component
 */
export const FilterBar = ({ filters, onFilterChange, onSearch }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      {filters.map((filter) => {
        if (filter.type === 'text') {
          return (
            <TextField
              key={filter.key}
              label={filter.label}
              value={filter.value}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 200 }}
            />
          );
        }

        if (filter.type === 'select') {
          return (
            <FormControl key={filter.key} size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filter.value}
                label={filter.label}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              >
                {filter.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }

        return null;
      })}

      {onSearch && (
        <Button
          variant="contained"
          onClick={onSearch}
          sx={{ backgroundColor: '#1a237e' }}
        >
          Search
        </Button>
      )}
    </Box>
  );
};

export default {
  ConfirmDialog,
  FilterBar,
};
