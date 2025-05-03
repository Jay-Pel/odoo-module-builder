const fs = require('fs');
const path = require('path');

/**
 * Updates the status of a task in the progress summary file
 * @param {string} taskId - The ID of the task to update (e.g., '021')
 * @param {string} newStatus - The new status ('Not Started', 'In Progress', 'Completed')
 */
function updateTaskStatus(taskId, newStatus) {
  const summaryPath = path.join(__dirname, 'progress-summary.md');
  
  try {
    // Read the current content
    let content = fs.readFileSync(summaryPath, 'utf8');
    
    // Create regex to match the task line
    const taskRegex = new RegExp(`\\|\\s*${taskId}\\s*\\|([^|]+)\\|([^|]+)\\|([^|]+)\\|`, 'g');
    
    // Replace the status in the matched line
    content = content.replace(taskRegex, (match, taskName, oldStatus, priority) => {
      return `| ${taskId} |${taskName}| ${newStatus} |${priority}|`;
    });
    
    // Write the updated content back to file
    fs.writeFileSync(summaryPath, content, 'utf8');
    
    console.log(`Successfully updated task ${taskId} status to ${newStatus}`);
  } catch (error) {
    console.error('Error updating progress summary:', error);
  }
}

/**
 * Updates multiple tasks at once
 * @param {Array<{taskId: string, status: string}>} updates - Array of task updates
 */
function batchUpdateTasks(updates) {
  updates.forEach(update => {
    updateTaskStatus(update.taskId, update.status);
  });
}

module.exports = {
  updateTaskStatus,
  batchUpdateTasks
}; 