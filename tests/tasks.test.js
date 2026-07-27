const test = require('node:test');
const assert = require('node:assert/strict');
const { filterTasks, getTaskStats } = require('../src/lib/tasks.js');

test('filters tasks by state', () => {
  const tasks = [
    { id: 1, title: 'Write plan', completed: false, priority: 'high' },
    { id: 2, title: 'Review notes', completed: true, priority: 'medium' }
  ];

  assert.equal(filterTasks(tasks, 'active').length, 1);
  assert.equal(filterTasks(tasks, 'completed')[0].title, 'Review notes');
});

test('computes task statistics', () => {
  const tasks = [
    { id: 1, title: 'Write plan', completed: false, priority: 'high' },
    { id: 2, title: 'Review notes', completed: true, priority: 'medium' }
  ];

  const stats = getTaskStats(tasks);
  assert.equal(stats.total, 2);
  assert.equal(stats.completed, 1);
  assert.equal(stats.active, 1);
  assert.equal(stats.completionRate, 50);
});
