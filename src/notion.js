const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Add a task
const addTask = async ({ name, description, dueDate, jiraLink }) => {
  const response = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: {
        title: [{ text: { content: name } }]
      },
      Description: {
        rich_text: [{ text: { content: description || '' } }]
      },
      'Due Date': {
        date: dueDate ? { start: dueDate } : null
      },
      'Jira Link': {
        url: jiraLink || null
      },
      Status: {
        select: { name: 'Pending' }
      }
    }
  });
  return response;
};

// Get all pending tasks
const getPendingTasks = async () => {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Status',
      select: {
        does_not_equal: 'Done'
      }
    }
  });
  return response.results;
};

// Find task by name
const findTaskByName = async (name) => {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Name',
      title: {
        contains: name
      }
    }
  });
  return response.results[0] || null;
};

// Modify task
const modifyTask = async (pageId, { name, description, dueDate, jiraLink }) => {
  const properties = {};
  if (name) properties.Name = { title: [{ text: { content: name } }] };
  if (description) properties.Description = { rich_text: [{ text: { content: description } }] };
  if (dueDate) properties['Due Date'] = { date: { start: dueDate } };
  if (jiraLink) properties['Jira Link'] = { url: jiraLink };

  const response = await notion.pages.update({
    page_id: pageId,
    properties
  });
  return response;
};

// Move task (update status)
const moveTask = async (pageId, status) => {
  const response = await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: {
        select: { name: status }
      }
    }
  });
  return response;
};

// Delete task (archive in Notion)
const deleteTask = async (pageId) => {
  const response = await notion.pages.update({
    page_id: pageId,
    archived: true
  });
  return response;
};

module.exports = {
  addTask,
  getPendingTasks,
  findTaskByName,
  modifyTask,
  moveTask,
  deleteTask
};
