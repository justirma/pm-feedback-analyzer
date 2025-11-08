import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  try {
    const { apiKey, feedback } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }
    if (!feedback) {
      return res.status(400).json({ error: 'Missing feedback' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Analyze the following customer feedback and categorize each piece into themes. For each feedback item, provide:
1. The original feedback text
2. Category (one of: bug, feature_request, ux_issue, praise)
3. Priority (high, medium, or low) based on urgency, impact, and sentiment
4. Brief reason for the priority assignment

Customer Feedback:
${feedback}

Return your analysis in this exact JSON format:
{
  "items": [
    {
      "text": "original feedback text",
      "category": "bug|feature_request|ux_issue|praise",
      "priority": "high|medium|low",
      "reason": "brief explanation"
    }
  ],
  "summary": {
    "total": number,
    "bugs": number,
    "feature_requests": number,
    "ux_issues": number,
    "praise": number,
    "high_priority": number,
    "medium_priority": number,
    "low_priority": number
  }
}`
        }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});