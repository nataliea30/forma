const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Mock CedarOS endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'cedaros-mock',
    timestamp: new Date().toISOString()
  });
});

app.post('/analyze', (req, res) => {
  const { sessionId, landmarks } = req.body;
  
  // Mock analysis response
  const analysis = {
    sessionId: sessionId || 'mock-session',
    timestamp: new Date().toISOString(),
    landmarks: landmarks || [],
    formScore: Math.floor(Math.random() * 40) + 60, // 60-100
    phase: 'active',
    issues: [],
    suggestions: [
      'Keep your back straight',
      'Maintain proper breathing',
      'Focus on form over speed'
    ],
    warnings: []
  };
  
  res.json({
    success: true,
    data: analysis
  });
});

app.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  res.json({
    success: true,
    data: {
      sessionId,
      status: 'active',
      startTime: new Date().toISOString(),
      totalAnalyses: Math.floor(Math.random() * 10) + 1
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CedarOS Mock Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
