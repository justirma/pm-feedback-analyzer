import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Wrench, Lightbulb, Frown, Loader2 } from 'lucide-react';

export default function PMFeedbackAnalyzer() {
  const [feedback, setFeedback] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenUsage, setTokenUsage] = useState(null);

  const analyzeFeedback = async () => {
    if (!feedback.trim()) {
      setError('Please enter some feedback to analyze');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please enter your Claude API key');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setTokenUsage(null);

    try {
      const response = await fetch('api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey,
          feedback: feedback
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      if (data.usage) {
        const inputCost = (data.usage.input_tokens / 1_000_000) * 3;
        const outputCost = (data.usage.output_tokens / 1_000_000) * 15;
        setTokenUsage({
          input: data.usage.input_tokens,
          output: data.usage.output_tokens,
          total: data.usage.input_tokens + data.usage.output_tokens,
          cost: inputCost + outputCost
        });
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not find JSON in Claude response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.items || !parsed.summary) {
        throw new Error('Parsed result missing expected keys (summary/items).');
      }
      
      setResults(parsed);
    } catch (err) {
      setError(err.message || 'Failed to analyze feedback');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bug': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'feature_request': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'ux_issue': return <Frown className="w-5 h-5 text-orange-500" />;
      case 'praise': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Wrench className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PM Feedback Analyzer</h1>
          <p className="text-gray-600 mb-6">Organize and prioritize customer feedback using AI</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claude API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.anthropic.com</a>
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Feedback (paste multiple items, separated by line breaks)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Example:&#10;The app crashes when I upload large files&#10;Love the new dashboard design!&#10;Can we get dark mode support?&#10;The search feature is really slow"
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <button
            onClick={analyzeFeedback}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Feedback'
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {results && (
          <div className="space-y-6">
            {tokenUsage && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📊 API Usage Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{tokenUsage.input.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Input Tokens</div>
                    <div className="text-xs text-gray-500 mt-1">Your prompt + feedback</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-indigo-600">{tokenUsage.output.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Output Tokens</div>
                    <div className="text-xs text-gray-500 mt-1">Claude's analysis</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{tokenUsage.total.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Tokens</div>
                    <div className="text-xs text-gray-500 mt-1">Combined usage</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">${tokenUsage.cost.toFixed(4)}</div>
                    <div className="text-sm text-gray-600">Estimated Cost</div>
                    <div className="text-xs text-gray-500 mt-1">Current request</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-sm text-gray-700">
                    <strong>💡 Learning Note:</strong> Claude Sonnet 4 costs $3/M input tokens and $15/M output tokens. 
                    This analysis used <strong>{tokenUsage.total.toLocaleString()} tokens</strong> total, 
                    costing approximately <strong>${tokenUsage.cost.toFixed(4)}</strong> (~{(tokenUsage.cost * 100).toFixed(2)}¢).
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results.summary.total}</div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.summary.bugs}</div>
                  <div className="text-sm text-gray-600">Bugs</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.summary.feature_requests}</div>
                  <div className="text-sm text-gray-600">Features</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{results.summary.ux_issues}</div>
                  <div className="text-sm text-gray-600">UX Issues</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.summary.high_priority}</div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.summary.medium_priority}</div>
                  <div className="text-sm text-gray-600">Medium Priority</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.summary.low_priority}</div>
                  <div className="text-sm text-gray-600">Low Priority</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Categorized Feedback</h2>
              <div className="space-y-4">
                {results.items.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <span className="font-medium text-gray-900">{getCategoryLabel(item.category)}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{item.text}</p>
                    <p className="text-sm text-gray-500 italic">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}