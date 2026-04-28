import React, { useState, useEffect } from 'react';

const RuleEditor = () => {
  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleCondition, setRuleCondition] = useState('');
  const [ruleAction, setRuleAction] = useState('');

  useEffect(() => {
    // Fetch existing rules from the backend
    const fetchRules = async () => {
      const response = await fetch('/api/rules');
      const data = await response.json();
      setRules(data);
    };

    fetchRules();
  }, []);

  const handleRuleSelect = (rule) => {
    setSelectedRule(rule);
    setRuleName(rule.name);
    setRuleCondition(rule.condition);
    setRuleAction(rule.action);
  };

  const handleSaveRule = async () => {
    const ruleData = {
      name: ruleName,
      condition: ruleCondition,
      action: ruleAction,
    };

    if (selectedRule) {
      // Update existing rule
      await fetch(`/api/rules/${selectedRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
    } else {
      // Create new rule
      await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
    }

    // Refresh the rules list
    const response = await fetch('/api/rules');
    const data = await response.json();
    setRules(data);
    resetForm();
  };

  const resetForm = () => {
    setSelectedRule(null);
    setRuleName('');
    setRuleCondition('');
    setRuleAction('');
  };

  return (
    <div>
      <h2>Rule Editor</h2>
      <div>
        <label>
          Rule Name:
          <input
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Condition:
          <input
            type="text"
            value={ruleCondition}
            onChange={(e) => setRuleCondition(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Action:
          <input
            type="text"
            value={ruleAction}
            onChange={(e) => setRuleAction(e.target.value)}
          />
        </label>
      </div>
      <button onClick={handleSaveRule}>Save Rule</button>
      <h3>Existing Rules</h3>
      <ul>
        {rules.map((rule) => (
          <li key={rule.id} onClick={() => handleRuleSelect(rule)}>
            {rule.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RuleEditor;