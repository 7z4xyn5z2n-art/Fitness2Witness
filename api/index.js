// Vercel serverless function entry point
import('../dist/index.mjs').then(module => {
  // Export the Express app as a Vercel serverless function
  module.default || module;
}).catch(err => {
  console.error('Failed to load backend:', err);
  throw err;
});

// Re-export the built server
export { default } from '../dist/index.mjs';
