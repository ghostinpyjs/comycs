// Vercel Speed Insights initialization
// This script loads and initializes Speed Insights for the project

import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights@2/dist/index.mjs';

// Initialize Speed Insights
// The library automatically detects development mode and doesn't track in that environment
injectSpeedInsights({
  debug: false,
  sampleRate: 1
});
