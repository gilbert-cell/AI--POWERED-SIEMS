import { useState, useCallback } from 'react';
import { aiService, rulesService } from '../../services/api';
import { toast } from 'react-toastify';
import { LIVE_POLL_INTERVAL, ADVANCED_POLL_INTERVAL } from '../../config';
import { formatTime } from '../../utils/helpers';

export { LIVE_POLL_INTERVAL, ADVANCED_POLL_INTERVAL };

export const useAIDecisions = () => {
  const [decisions, setDecisions] = useState([]);
  const [models, setModels] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advancedLoading, setAdvancedLoading] = useState(false);

  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await aiService.getDecisions();
      setDecisions(res.data.results || res.data);
    } catch { toast.error('Failed to fetch AI decisions'); }
    finally { setLoading(false); }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await aiService.getModels();
      setModels(res.data.results || res.data);
    } catch { toast.error('Failed to fetch AI models'); }
    finally { setLoading(false); }
  }, []);

  const fetchAccuracy = useCallback(async () => {
    try {
      setLoading(true);
      const res = await aiService.getAccuracy();
      setAccuracy(res.data);
      setLastUpdated(formatTime(new Date()));
    } catch { toast.error('Failed to fetch accuracy metrics'); }
    finally { setLoading(false); }
  }, []);

  const fetchAdvanced = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setAdvancedLoading(true);
      const res = await aiService.getAdvancedDecisions();
      setAdvancedData(res.data);
    } catch { toast.error('Failed to fetch advanced decisions'); }
    finally { setAdvancedLoading(false); }
  }, []);

  const handleCreateRule = async (attackType, source, score) => {
    try {
      const res = await rulesService.createFromDecision({ attack_type: attackType, source, score });
      res.data.status === 'exists'
        ? toast.info(`Rule already exists: ${res.data.rule.name}`)
        : toast.success(`Rule created: ${res.data.rule.name}`);
    } catch { toast.error('Failed to create rule'); }
  };

  const handleSaveWeights = async (modelId, weights, onSuccess) => {
    try {
      await aiService.updateModelWeights(modelId, { weights });
      toast.success('Model weights updated successfully');
      onSuccess?.();
      fetchModels();
    } catch { toast.error('Failed to update model weights'); }
  };

  return {
    decisions, models, accuracy, advancedData, lastUpdated,
    loading, advancedLoading,
    fetchDecisions, fetchModels, fetchAccuracy, fetchAdvanced,
    handleCreateRule, handleSaveWeights,
  };
};
