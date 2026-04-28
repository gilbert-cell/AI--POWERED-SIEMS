import React, { useState } from 'react';

const ThresholdAdjuster: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(0);

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(Number(event.target.value));
  };

  const handleSave = () => {
    // Logic to save the threshold value to the backend
    console.log('Threshold saved:', threshold);
  };

  return (
    <div>
      <h2>Threshold Adjuster</h2>
      <label>
        Alert Threshold:
        <input
          type="number"
          value={threshold}
          onChange={handleThresholdChange}
        />
      </label>
      <button onClick={handleSave}>Save Threshold</button>
    </div>
  );
};

export default ThresholdAdjuster;