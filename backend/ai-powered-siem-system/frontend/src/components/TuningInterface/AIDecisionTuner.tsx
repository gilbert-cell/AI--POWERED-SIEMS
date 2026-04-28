import React, { useState } from 'react';

const AIDecisionTuner: React.FC = () => {
  const [decisionThreshold, setDecisionThreshold] = useState<number>(0.5);
  const [modelVersion, setModelVersion] = useState<string>('v1.0');

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDecisionThreshold(parseFloat(event.target.value));
  };

  const handleModelVersionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModelVersion(event.target.value);
  };

  const saveSettings = () => {
    // Logic to save the settings to the backend
    console.log('Settings saved:', { decisionThreshold, modelVersion });
  };

  return (
    <div>
      <h2>AI Decision Tuner</h2>
      <div>
        <label>
          Decision Threshold:
          <input
            type="number"
            value={decisionThreshold}
            onChange={handleThresholdChange}
            step="0.01"
            min="0"
            max="1"
          />
        </label>
      </div>
      <div>
        <label>
          Model Version:
          <select value={modelVersion} onChange={handleModelVersionChange}>
            <option value="v1.0">v1.0</option>
            <option value="v1.1">v1.1</option>
            <option value="v2.0">v2.0</option>
          </select>
        </label>
      </div>
      <button onClick={saveSettings}>Save Settings</button>
    </div>
  );
};

export default AIDecisionTuner;