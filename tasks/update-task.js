#!/usr/bin/env node

const { updateTaskStatus } = require('./update-progress');

const taskId = process.argv[2];
const newStatus = process.argv[3];

const validStatuses = ['Not Started', 'In Progress', 'Completed'];

if (!taskId || !newStatus) {
  console.error('Usage: node update-task.js <taskId> <status>');
  console.error('Example: node update-task.js 024 "In Progress"');
  process.exit(1);
}

if (!validStatuses.includes(newStatus)) {
  console.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  process.exit(1);
}

updateTaskStatus(taskId, newStatus); 