const { App } = require('@slack/bolt');
const cron = require('node-cron');
const { getPendingTasks } = require('./notion');
const { registerCommands } = require('./commands');
require('dotenv').config();

// Initialise Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false
});

// Register all slash commands
registerCommands(app);

// Daily digest — runs every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    const tasks = await getPendingTasks();

    if (tasks.length === 0) {
      await app.client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID,
        text: '🎉 No pending tasks for today!'
      });
      return;
    }

    const taskList = tasks.map((task, index) => {
      const name = task.properties.Name.title[0]?.plain_text || 'Untitled';
      const description = task.properties.Description.rich_text[0]?.plain_text || '-';
      const dueDate = task.properties['Due Date'].date?.start || '-';
      const jiraLink = task.properties['Jira Link'].url || '-';
      const status = task.properties.Status.select?.name || '-';

      return `${index + 1}. *${name}*\n   📝 ${description}\n   📅 Due: ${dueDate}\n   🔗 Jira: ${jiraLink}\n   📌 Status: ${status}`;
    }).join('\n\n');

    await app.client.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID,
      text: `📋 *Pending Tasks — ${new Date().toDateString()}*\n\n${taskList}`
    });

  } catch (error) {
    console.error('Daily digest error:', error);
  }
});

// Start the app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log(`⚡ TaskBot is running on port ${process.env.PORT || 3000}`);
})();
