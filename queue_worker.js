var Queue = require('firebase-queue'),
    firebase = require('firebase'),
    secrets = require('./secrets'),
    twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.secret);


// create reusable transporter object using the default SMTP transport
firebase.initializeApp(secrets.firebaseConfig);

var db = firebase.database();
var ref = db.ref("queue/tasks");

// Creates the Queue
var options = {
  specId: 'task_1',
  numWorkers: 10
};

var checkQueue = function(){
  var currentDate = Date.now();
  var ordered = ref.orderByChild("date_to_open").limitToFirst(100).on("value", function(child){
    if(child.val() == null) return;

    for(taskKey in child.val()){
      var task = child.val()[taskKey]
      if(task["date_to_open"] <= currentDate + 1000){
        getRecipients(task['capsule']);
      }
    }
  });
};

setInterval(checkQueue, 1000);

var getRecipients = function(capsuleId){
  var capsule = db.ref("capsules/" + capsuleId);

  capsule.child("recipients").on("value", function(recipientId){
    var recipientIds = [];
    var recipients = []

    for(key in recipientId.val()){
      recipientIds.push(key)
    }

    var getRecipient = function(recipient){

      recipients.push(recipient.val());

      if(recipientIds.length == recipients.length)
        sendCapsule(capsuleId, recipients);

    };

    for(var i = 0; i < recipientIds.length; i++){
      db.ref('recipients/' + recipientIds[i]).on("value", getRecipient);
    }

  });
}

var sendCapsule = function(capsuleId, recipients){

  for(var i = 0; i < recipients.length; i++){
    var recipient = recipients[i];

    if(recipient["type"] === "phone"){
      console.log("Sending text message to: ", recipient)
      textCapsule(capsuleId, recipient);
    } else if(recipient["type"] === "email"){
      console.log("Sending email to ", recipient)
      emailCapsule(capsuleId, recipient);
    }
  }

  removeCapsuleFromQueue(taskKey);
};

var removeCapsuleFromQueue = function(taskId){
  ref.child(taskId).remove()
};

var textCapsule = function(capsuleId, recipient){

  var url = "http://students.washington.edu/cta95/time-capsule.html";
  var message = "You have recieved a time capsule! View it at : " + url;
  message += "?" + capsuleId;

  twilio.messages.create({
  		to: recipient.phone,
  		from: "+14252303217",
  		body : message
  	}, function(err, message) {
  		// console.log(message.sid);
  	});
}

var emailCapsule = function(capsuleId, recipient){
  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: '"Fred Foo 👥" <foo@blurdybloop.com>', // sender address
      to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
      subject: 'Hello ✔', // Subject line
      text: 'Hello world 🐴', // plaintext body
      html: '<b>Hello world 🐴</b>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      console.log('Message sent: ' + info.response);
  });
}

/*
var queue = new Queue(ref, options, function(data, progress, resolve, reject) {
  // Read and process task data
  console.log(data);

  // Do some work
  var percentageComplete = 0;
  var interval = setInterval(function() {
    percentageComplete += 20;
    if (percentageComplete >= 100) {
      clearInterval(interval);
    } else {
      progress(percentageComplete);
    }
  }, 1000);

  // Finish the task
  setTimeout(function() {
    resolve();
  }, 5000);
});*/
