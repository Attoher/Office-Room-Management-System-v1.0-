// start-dev.js
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Office Room Management System...\n');

// Start backend
console.log('1. Starting Backend Server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a bit then start frontend
setTimeout(() => {
  console.log('2. Starting Frontend Server...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });
}, 3000);

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  process.exit();
});