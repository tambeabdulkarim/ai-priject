const test = require('node:test');
const assert = require('node:assert/strict');
const { searchTasks, reorderTasks, getReminderAlerts } = require('../src/lib/taskFeatures.js');

test('filters tasks by title search query', () => {
  const tasks = [
    { id: 1, title: 'Ship the dashboard', completed: false, priority: 'high' },
    { id: 2, title: 'Write release notes', completed: false, priority: 'medium' }
  ];

  const filtered = searchTasks(tasks, 'ship');

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, 'Ship the dashboard');
});

test('moves a task to a new position in the list', () => {
  const tasks = [
    { id: 1, title: 'First', completed: false, priority: 'low' },
    { id: 2, title: 'Second', completed: false, priority: 'medium' },
    { id: 3, title: 'Third', completed: false, priority: 'high' }
  ];

  const reordered = reorderTasks(tasks, 3, 1);

  assert.deepEqual(reordered.map((task) => task.id), [1, 3, 2]);
});

test('returns reminder alerts for overdue and urgent tasks', () => {
  const today = new Date();
  const overdue = today.toISOString().slice(0, 10);
  const soon = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const alerts = getReminderAlerts([
    { id: 1, title: 'Review handoff', completed: false, priority: 'high', dueDate: overdue },
    { id: 2, title: 'Prepare demo', completed: false, priority: 'medium', dueDate: soon }
  ]);

  assert.equal(alerts.length, 2);
  assert.equal(alerts[0].title, 'Review handoff');
  assert.equal(alerts[1].title, 'Prepare demo');
});
