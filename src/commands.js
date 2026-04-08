const { addTask, findTaskByName, modifyTask, moveTask, deleteTask } = require('./notion');

const registerCommands = (app) => {

  // /addtask name | description | due date | jira link
  // Example: /addtask Fix login bug | Login page crashes | 2026-04-10 | https://jira.com/JIRA-123
  app.command('/addtask', async ({ command, ack, respond }) => {
    await ack();
    try {
      const parts = command.text.split('|').map(p => p.trim());
      const [name, description, dueDate, jiraLink] = parts;

      if (!name) {
        await respond('❌ Please provide at least a task name.\nFormat: `/addtask name | description | due date | jira link`');
        return;
      }

      await addTask({ name, description, dueDate, jiraLink });
      await respond(
        `✅ Task added!\n*Name:* ${name}\n*Description:* ${description || '-'}\n*Due Date:* ${dueDate || '-'}\n*Jira:* ${jiraLink || '-'}`
      );
    } catch (error) {
      console.error(error);
      await respond('❌ Failed to add task. Please try again.');
    }
  });

  // /modifytask task name | field | new value
  // Example: /modifytask Fix login bug | description | Updated description
  app.command('/modifytask', async ({ command, ack, respond }) => {
    await ack();
    try {
      const parts = command.text.split('|').map(p => p.trim());
      const [taskName, field, newValue] = parts;

      if (!taskName || !field || !newValue) {
        await respond('❌ Format: `/modifytask task name | field | new value`\nFields: name, description, dueDate, jiraLink');
        return;
      }

      const task = await findTaskByName(taskName);
      if (!task) {
        await respond(`❌ Task "*${taskName}*" not found.`);
        return;
      }

      const updateData = {};
      if (field === 'name') updateData.name = newValue;
      if (field === 'description') updateData.description = newValue;
      if (field === 'dueDate') updateData.dueDate = newValue;
      if (field === 'jiraLink') updateData.jiraLink = newValue;

      await modifyTask(task.id, updateData);
      await respond(`✅ Task "*${taskName}*" updated!\n*${field}* → ${newValue}`);
    } catch (error) {
      console.error(error);
      await respond('❌ Failed to modify task. Please try again.');
    }
  });

  // /movetask task name | status
  // Example: /movetask Fix login bug | In Progress
  app.command('/movetask', async ({ command, ack, respond }) => {
    await ack();
    try {
      const parts = command.text.split('|').map(p => p.trim());
      const [taskName, status] = parts;

      if (!taskName || !status) {
        await respond('❌ Format: `/movetask task name | status`\nStatuses: Pending, In Progress, Done');
        return;
      }

      const validStatuses = ['Pending', 'In Progress', 'Done'];
      if (!validStatuses.includes(status)) {
        await respond(`❌ Invalid status. Use one of: ${validStatuses.join(', ')}`);
        return;
      }

      const task = await findTaskByName(taskName);
      if (!task) {
        await respond(`❌ Task "*${taskName}*" not found.`);
        return;
      }

      await moveTask(task.id, status);
      await respond(`✅ Task "*${taskName}*" moved to *${status}*!`);
    } catch (error) {
      console.error(error);
      await respond('❌ Failed to move task. Please try again.');
    }
  });

  // /deletetask task name
  // Example: /deletetask Fix login bug
  app.command('/deletetask', async ({ command, ack, respond }) => {
    await ack();
    try {
      const taskName = command.text.trim();

      if (!taskName) {
        await respond('❌ Format: `/deletetask task name`');
        return;
      }

      const task = await findTaskByName(taskName);
      if (!task) {
        await respond(`❌ Task "*${taskName}*" not found.`);
        return;
      }

      await deleteTask(task.id);
      await respond(`🗑️ Task "*${taskName}*" deleted!`);
    } catch (error) {
      console.error(error);
      await respond('❌ Failed to delete task. Please try again.');
    }
  });

};

module.exports = { registerCommands };
