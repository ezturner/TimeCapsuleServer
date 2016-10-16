var firebase = require('firebase'),
  secrets = require('./secrets');

// Same ref as in queue_worker.js

firebase.initializeApp(secrets.firebaseConfig);

var db = firebase.database();
var ref = db.ref("queue");

// This doesn't need to be set every time, but helps us
// define the spec for the task in this example
ref.child('specs').set({
  task_1: {
    in_progress_state: 'task_1_in_progress',
    timeout: 10000
  }
});

// Add tasks onto the queue
var taskNumber = 0;
setInterval(function() {
  ref.child('tasks').push({
    taskNumber: ++taskNumber,
    date_to_open: Date.now(),
    capsule : "730c857a-eb3f-4f96-baa3-5dffe2cafac0"
  });

  process.exit()
}, 1000);
