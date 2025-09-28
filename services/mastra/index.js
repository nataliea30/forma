const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Mastra endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mastra-mock',
    timestamp: new Date().toISOString()
  });
});

app.post('/analyze', (req, res) => {
  const { exercise, landmarks, formIssues, currentPhase } = req.body;
  
  // Mock analysis response
  const analysis = {
    exercise: exercise || 'squat',
    confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
    suggestions: [
      'Great form! Keep it up!',
      'Try to maintain consistent tempo',
      'Focus on your breathing pattern'
    ],
    warnings: formIssues || [],
    improvements: [
      'Your depth has improved this session',
      'Better knee alignment detected'
    ],
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: analysis
  });
});

app.post('/track', (req, res) => {
  const { userId, sessionId, metricType, value } = req.body;
  
  res.json({
    success: true,
    data: {
      userId,
      sessionId,
      metricType,
      value,
      timestamp: new Date().toISOString(),
      tracked: true
    }
  });
});

app.get('/analytics/:userId', (req, res) => {
  const { userId } = req.params;
  
  res.json({
    success: true,
    data: {
      userId,
      totalSessions: Math.floor(Math.random() * 20) + 5,
      averageScore: Math.floor(Math.random() * 20) + 75,
      improvements: [
        'Form consistency improved by 15%',
        'Range of motion increased by 8%'
      ],
      lastUpdated: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mastra Mock Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
