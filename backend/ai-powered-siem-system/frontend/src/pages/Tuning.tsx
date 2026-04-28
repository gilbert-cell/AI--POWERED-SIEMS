import React from 'react';
import RuleEditor from '../components/TuningInterface/RuleEditor';
import ThresholdAdjuster from '../components/TuningInterface/ThresholdAdjuster';
import AIDecisionTuner from '../components/TuningInterface/AIDecisionTuner';

const Tuning: React.FC = () => {
  return (
    <div>
      <h1>Tuning Interface</h1>
      <RuleEditor />
      <ThresholdAdjuster />
      <AIDecisionTuner />
    </div>
  );
};

export default Tuning;