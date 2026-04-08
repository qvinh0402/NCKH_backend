#!/usr/bin/env node

/**
 * Quick AI Service Test
 * Usage: node test-quick.js
 */

const { getAvailableModels, callAI } = require('./src/services/aiService');

console.log('\n🤖 AI SERVICE - QUICK TEST\n');
console.log('='.repeat(60));

// Test 1: Check available models
console.log('\n1️⃣ Available AI Models:');
console.log('-'.repeat(60));

const models = getAvailableModels();
if (models.length === 0) {
  console.log('❌ No AI models found!');
  process.exit(1);
}

models.forEach(m => {
  console.log(`${m.status} ${m.name}`);
  console.log(`   Provider: ${m.provider}`);
  console.log(`   Model: ${m.model}`);
});

// Test 2: Check if any model is available
const available = models.filter(m => m.status.includes('Available'));
if (available.length === 0) {
  console.log('\n❌ No API keys configured in .env');
  console.log('\nTo use AI features, add to .env:');
  console.log('  GROQ_API_KEY="your-key-here"');
  console.log('  OPENROUTER_API_KEY="your-key-here"');
  process.exit(1);
}

// Test 3: Summary
console.log('\n✅ Setup Complete!');
console.log('-'.repeat(60));
console.log(`✓ ${available.length} AI model(s) ready`);
console.log('\nYou can now use:');
console.log('  - const { callAI } = require("./src/services/aiService");');
console.log('  - const { analyzeReview } = require("./src/services/aiReviewService");');
console.log('\nRun: npm test (for full test suite)');
console.log('='.repeat(60) + '\n');

process.exit(0);
