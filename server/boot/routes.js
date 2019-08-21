'use strict';
require('dotenv').config();

const axios = require('axios');
const bot = require('../bot');

let checkedIn = [];
let students = [];
let url = process.env.BASE_URL ? process.env.BASE_URL : 'http://localhost:3000/';

var schedule = require('node-schedule');

module.exports = (app) => {
  app.models.student.find({})
    .then(response => {
      let studentsFromDb = response;
      studentsFromDb.forEach(student => {
        students.push(
          {
            slack_id: student.slack_id,
            id: student.id,
            submitted: false,
            reported: false,
            questionOne: 'What did you do since Yesterday?',
            yesterday: '',
            questionTwo: 'What will you do Today?',
            today: '',
            questionThree: 'Anything blocking your progress?',
            blockers: '',
            date: null,
          }
        );
      });
    })
    .catch(err => console.log(err));

  app.post('/slack/doorbell', (req, res) => {
    res.send('Ringing the doorbell');
    handleEvent(req.body, 'doorbell');
  });

  app.post('/slack/standup', (req, res) => {
    handleEvent(req.body, 'standup');
    res.status(200).send('');
  });

  app.post('/slack/checkin', (req, res) => {
    const {user_id, channel_id} = req.body;
    res.send(`Click the link to confirm your location to check in: ${process.env.BASE_URL}getGeo?user=${user_id}&channel=${channel_id}&checkin=true`);
  });

  app.post('/slack/checkout', (req, res) => {
    const {user_id, channel_id} = req.body;
    res.send(`Click the link to confirm your location to check out: ${process.env.BASE_URL}getGeo?user=${user_id}&channel=${channel_id}&checkin=false`);
  });

  app.post('/slack/interactive', (req, res) => {
    const body = JSON.parse(req.body.payload);
    switch (body.callback_id) {
      case 'gotin':
        handleEvent(body, 'gotin');
        res.send('Have a nice day');
        break;
      case 'latecheckout':
        if (body.actions[0].value === 'yes') {
          res.send(`Click the link to confirm your location to check out: ${process.env.BASE_URL}getGeo?user=${body.user.id}&channel=${body.channel.id}&checkin=false`);
        } else {
          handleEvent(body, 'checkout');
          res.send('Remember to check out before you leave next time.');
        }
        break;
      case 'standupResponse':
        if (body.type === 'dialog_cancellation') {
          handleEvent(body, 'cancelStandup');
        } else { // dialog_submission
          handleEvent(body, 'submitStandup');
        }
        res.send('');
        break;
      default:
        res.send('Not sure what you were trying to do here...');
        break;
    }
  });

  app.post('/submitGeo', (req, res) => {
    if (req.body.token == process.env.token || '0') {
      if (req.body.checkin === 'true') {
        handleEvent(req.body, 'checkin');
      } else {
        handleEvent(req.body, 'checkout');
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(401);
    }
  });

  app.get('/getGeo', (req, res) => {
    const {user, channel, checkin} = req.query;
    res.render('index', {user, channel, checkin, token: process.env.token});
  });

  const handleEvent = (body, command) => {
  /* the variable on the left represents the response from a slash command, and
  the variables on the right are coming from an interactive command  */

    const user = body.user_id ||  body.user.id;
    const channel = body.channel_id || body.channel.id;

    const loc = {
      lat: body.lat,
      long: body.long,
    };

    switch (command) {
      case 'doorbell':
        doorbell(user, channel);
        break;
      case 'standup':
        standup(user, channel, body.trigger_id);
        break;
      case 'cancelStandup':
        cancelStandup(user, channel);
        break;
      case 'submitStandup':
        submitStandup(user, channel, body.submission);
        break;
      case 'gotin':
        gotIn(user, channel);
        break;
      case 'checkin':
        checkIn(user, loc, channel);
        break;
      case 'checkout':
        checkOut(user, loc, channel);
        break;
      default:
        break;
    }
  };

  // 9:00am
  const morningReminder = schedule.scheduleJob({hour: 9, minute: 0}, () => {
    bot.getUsers().then(users => {
      users.members.forEach(user => {
        if (!checkedIn.includes(user.id)) {
          bot.postEphemeral(
            process.env.STUDENTS_CHANNEL, 
            user.id, 
            ':alarm_clock: Don\'t forget to check in');
        }
      });
    });
  });

  // 5:50pm
  const earlyCheckOutReminder = schedule.scheduleJob({hour: 17, minute: 50}, () => {
    checkedIn.forEach(user => {
      bot.postEphemeral(
        process.env.STUDENTS_CHANNEL, 
        user.slack_id, 
        ':alarm_clock: Don\'t forget to check out before you leave');
    });
  });

  // 6:15pm
  const lateCheckOutReminder = schedule.scheduleJob({hour: 18, minute: 15}, () => {
    var message = {
      'attachments': [
        {
          'title': 'Time to check out!',
          'text': 'Are you still here?',
          'callback_id': 'latecheckout',
          'color': '#3AA3E3',
          'attachment_type': 'default',
          'actions': [
            {
              'name': 'yes',
              'text': 'Yes, please check me out',
              'style': 'primary',
              'type': 'button',
              'value': 'yes',
            },
            {
              'name': 'no',
              'text': 'No',
              'style': 'danger',
              'type': 'button',
              'value': 'no',
            },
          ],
        },
      ],
    };
    checkedIn.forEach(user => {
      bot.postEphemeral(process.env.STUDENTS_CHANNEL, user, '', message);
    });
  });

  // 6:20pm
  const checkOutCache = schedule.scheduleJob({hour: 18, minute: 20}, () => {
    let promisesToKeep =[];
    while( checkedIn.length ){
      let userCheckInData = checkedIn.pop();
      bot.postEphemeral(
        process.env.STUDENTS_CHANNEL,
        userCheckInData.slack_id,
        ":alarm_clock: Auto-checkout test!"
      );
      userCheckInData.checkout_time = new Date();
      userCheckInData.hours = (
        (userCheckInData.checkout_time - userCheckInData.checkin_time) /
        (1000 * 60 * 60) ); // milliseconds in a sec, seconds in a min, minutes in an hour
      let addCheckin = 
        app.models.checkin
        .create(userCheckInData)
        .catch(err => console.log(err));
      promisesToKeep.push(addCheckin);
    }
    if( promisesToKeep.length > 0 ) {
      Promise.all(promisesToKeep.map(p => p.catch(error => console.log(err))))
        .then()
        .catch(err => console.log(err));
    }
    checkedIn = [];
  });

  function doorbell(user, channel) {
    var params = {
      icon_url: 'icon.png',
    };
    var message = {
      'attachments': [
        {
          'text': 'Once inside please click the button below',
          'callback_id': 'gotin',
          'color': '#3AA3E3',
          'attachment_type': 'default',
          'actions': [
            {
              'name': 'yes',
              'text': 'Got In!',
              'type': 'button',
              'value': 'gotin',
            },
          ],
        },
      ],
    };
    bot.postMessage(process.env.KEY_CHANNEL, `<@${user}> is at the door.`, params)
      .then((response) => {
        bot.postEphemeral(channel, user, 'Did you get in?', message);
      });
  };

  function gotIn(user, channel) {
    bot.postMessage(process.env.KEY_CHANNEL, "I'm in!", {});
  };

  function standup(user, channel, trigger_id) {
    let currentStudent = students.find(s => s.slack_id === user);

    if (!currentStudent.submitted) {
      axios({
        'method': 'post',
        'url': 'https://slack.com/api/dialog.open',
        'headers': {
          'Authorization': 'Bearer ' + process.env.OAUTH_ACCESS_TOKEN,
          'content-type': 'application/json',
        },
        'data': {
          'trigger_id': trigger_id,
          'dialog': {
            'callback_id': 'standupResponse',
            'title': 'Daily Standup',
            'submit_label': 'Submit',
            'notify_on_cancel': true,
            'elements': [
              {
                'type': 'textarea',
                'label': 'What did you do since yesterday?',
                'name': 'yesterday',
              },
              {
                'type': 'textarea',
                'label': 'What will you do today?',
                'name': 'today',
              },
              {
                'type': 'textarea',
                'label': 'Is anything blocking your progress?',
                'name': 'blockers',
              },
            ],
          },
        },
      })
      .catch(err => {
        console.log(`error in standup was ${err}`);
      });
    } else {
      var params = {
        icon_emoji: ':smiley:',
      };
      bot.postEphemeral(channel, user, 'You have already submitted your standup for today.', params);
    }
  };

  function cancelStandup(user, channel) {
    var params = {
      icon_emoji: ':sadpepe:',
    };
    bot.postEphemeral(channel, user, 'Please submit your standup later today.', params);
  };

  function submitStandup(user, channel, submission) {
    let currentStudent = students.find(s => s.slack_id === user);

    currentStudent.yesterday = submission.yesterday;
    currentStudent.today = submission.today;
    currentStudent.blockers = submission.blockers;
    currentStudent.submitted = true;
    currentStudent.date = new Date(Date.now());
    var params = {
      icon_emoji: ':pepedance:',
    };
    let newDate = new Date();

    const addStandup = app.models.student.find({'where': {'slack_id': user}})
    .then(student => {
      app.models.standup.create({
        "slack_id": user,
        "date": newDate,
        "tasks_yesterday": submission.yesterday,
        "tasks_today": submission.today,
        "blockers": submission.blockers,
        "studentId": student[0].id,
      });
    })
    .catch(err => console.log(err));

    const updateStudentStandup = app.models.student.updateAll(
      {slack_id: user},
      {'date-of-last-standup': newDate})
      .catch(err => console.log(err))
    
    Promise.all([addStandup, updateStudentStandup])
      .then()
      .catch(err => console.log(err));

      bot.postEphemeral(channel, user, 'Have a great day!', params);
      adminReport();
  };

  function checkIn(user, loc, channel) {
    let checkInData = checkedIn.filter(e => e.slack_id === user); 

    if (checkedIn.filter(e => e.slack_id === user).length>0){
      var params = {
        icon_emoji: ':x:',
      };
      bot.postEphemeral(channel, user, 'You have already checked in!', params);
    } else {
      // post message "you have checked in"
      const isNearby = (loc.lat && loc.long) && (Math.abs(loc.lat - process.env.LAT) < 0.0001 && Math.abs(loc.long - process.env.LONG) < 0.0001);

      let userCheckInData={
        slack_id: user,
        checkin_time: new Date(),
        checkout_time: undefined,
        hours: 0
      }
      axios.post('/api/logs/checkIn', `user=${user}&lat=${loc.lat}&long=${loc.long}`,
        {
          headers: {'content-type': 'application/x-www-form-urlencoded'},
          baseURL: process.env.BASE_URL,
        })
        .then((response) => {
          if (response.status === 200) {
            var params = {
              icon_emoji: ':heavy_check_mark:',
            };
            bot.postEphemeral(channel, user, 'You have checked in!', params);
            checkedIn.push(userCheckInData);
            if (process.env.EXTERNAL_LOGGING) {
              axios.post(process.env.EXTERNAL_LOGGING_URL,
                {
                  user,
                  method: 'checkin',
                  loc,
                  isNearby,
                  token: process.env.EXTERNAL_LOGGING_TOKEN,
                }
              );
            };
          } else {
            var params = {
              icon_emoji: ':x:',
            };
            bot.postEphemeral(channel, user, 'Error', params);
          }
        })
        .catch(err => {
          let thisline = new Error().lineNumber;
          console.log(thisline,err);

          checkedIn.push(userCheckInData);
          if(process.env.EXTERNAL_LOGGING_URL) {
            var params = {
              icon_emoji: ':x:',
            };
            bot.postEphemeral(channel, user, 'You have already checked in!', params);
          }
        }); // end of axios call
    }
  };

  function checkOut(user, loc, channel, penalty = 'none') {
    let checkInData = checkedIn.filter(e => e.slack_id === user);
    if ( ! checkedIn.filter(e => e.slack_id === user).length ){
      // can't check out if not checked in
      // post message "you have not checked in"

      var params = {
        icon_emoji: ':x:',
      };
      bot.postEphemeral(channel, user, 'You have not checked in!', params);
    } else {
      // remove from checkedIn array -> for loop, if user, remove
      // post message "you have checked out"
      const isNearby = (loc.lat && loc.long) && (Math.abs(loc.lat - process.env.LAT) < 0.0001 && Math.abs(loc.long - process.env.LONG) < 0.0001);
      if (penalty === 'none' && !isNearby) {
        penalty = 'notAtSchool';
      }
      axios.post('/api/logs/checkOut', `user=${user}&lat=${loc.lat || 0}&long=${loc.long || 0}&penalty=${penalty}`,
        {
          headers: {'content-type': 'application/x-www-form-urlencoded'},
          baseURL: process.env.BASE_URL,
        })
        .then((response) => {
          if (response.status === 200) {
            var params = {
              icon_emoji: ':heavy_check_mark:',
            };
            bot.postEphemeral(channel, user, penalty === 'timeout' ? ':warning: You have been automatically checked out.' : 'You have checked out!', params);
            let ArrUserCheckInData = checkedIn.filter(e => e.slack_id === user);
            let promisesToKeep =[]; // grab any and all open checkins for this user
            while( ArrUserCheckInData.length ){
              let userCheckInData = ArrUserCheckInData.pop();
              userCheckInData.checkout_time = new Date();
              userCheckInData.hours = (
                (userCheckInData.checkout_time - userCheckInData.checkin_time) /
                (1000 * 60 * 60) ); 
                // (milliseconds in a sec) * (seconds in a min) * (minutes in an hour)
              let addCheckin = 
                app.models.checkin
                .create(userCheckInData)
                .catch(err => {
                  let thisline = new Error().lineNumber;
                  console.log(thisline,err);
                });
              promisesToKeep.push(addCheckin);
            }
            if( promisesToKeep.length > 0 ) {
              Promise.all(promisesToKeep)
                .then()
                .catch(err => {
                  let thisline = new Error().lineNumber;
                  console.log(thisline,err);
                });
            }       
            checkedIn = checkedIn.filter(e => e.slack_id !== user);

            if (process.env.EXTERNAL_LOGGING) {
              axios.post(process.env.EXTERNAL_LOGGING_URL,
                {
                  user,
                  method: 'checkout',
                  loc,
                  isNearby,
                  token: process.env.EXTERNAL_LOGGING_TOKEN,
                }
              );
            };
          } else {
            var params = {
              icon_emoji: ':x:',
            };
            bot.postEphemeral(channel, user, 'Error', params);
          }
        })
        .catch(err => {
          let thisline = new Error().lineNumber;
          console.log(thisline,err);

          checkedIn = checkedIn.filter(e => e.slack_id !== user);
        });
    }
  };

  function adminReport() {
    students.map(reports => {
      if (reports.submitted === true && reports.reported === false) {
        let report = `
          <@${reports.slack_id}> @${reports.date.toLocaleString()}
          *${reports.questionOne}*
          - ${reports.yesterday}
          *${reports.questionTwo}*
          - ${reports.today}
          *${reports.questionThree}*
          - ${reports.blockers}
        `;
        bot.postMessage(process.env.ADMIN_REPORTS_CHANNEL, report, {mrkdwn: true});
        reports.reported = true;
      }
    });
  };

  // resets student standups @11:59pm.

  const standupReset = schedule.scheduleJob({hour: 23, minute: 59}, () => {
    students.map(reports => {
      reports.reported = false;
      reports.submitted = false;
      reports.yesterday = '';
      reports.today = '';
      reports.blockers = '';
      reports.date = null;
    });
  });

  // 9:00am stand-up reminder
  const earlyReminder = schedule.scheduleJob({hour: 9, minute: 15}, () => {
    students.forEach(user => {
      if (!user.submitted) {
        bot.postEphemeral(
          process.env.STUDENTS_CHANNEL,
          user.slack_id,
          ":alarm_clock: Don't forget to do your Stand-Up!"
        );
      }
    });
  });

  // 1:00pm stand-up reminder
  const lateReminder = schedule.scheduleJob({hour: 13, minute: 0}, () => {
    students.forEach(user => {
      if (!user.submitted) {
        bot.postEphemeral(
          process.env.STUDENTS_CHANNEL,
          user.slack_id,
          ":alarm_clock: Don't forget to do your Stand-Up!"
        );
      }
    });
  });

  // every X minute checkout test
  if( process.env.DEBUG_AUTO_CHECKOUT >= 1 && process.env.DEBUG_AUTO_CHECKOUT <= 30 ) {
    console.log();
    console.log('Debug process.env.DEBUG_AUTO_CHECKOUT set to every', process.env.DEBUG_AUTO_CHECKOUT, 'minute(s).');
    console.log();
    const autoCheckout = schedule.scheduleJob(`*/${process.env.DEBUG_AUTO_CHECKOUT} * * * *`, () => {
      let promisesToKeep =[];
      while( checkedIn.length ){
        let userCheckInData = checkedIn.pop();
        bot.postEphemeral(
          process.env.STUDENTS_CHANNEL,
          userCheckInData.slack_id,
          ":alarm_clock: Auto-checkout test!"
        );
        userCheckInData.checkout_time = new Date();
        userCheckInData.hours = (
          (userCheckInData.checkout_time - userCheckInData.checkin_time) /
          (1000 * 60 * 60) ); // milliseconds in a sec, seconds in a min, minutes in an hour
        let addCheckin = 
          app.models.checkin
          .create(userCheckInData)
          .catch(err => console.log(err));
        promisesToKeep.push(addCheckin);
      }
      if( promisesToKeep.length > 0 ) {
        Promise.all(promisesToKeep.map(p => p.catch(error => console.log(err))))
          .then()
          .catch(err => console.log(err));
      }
      checkedIn = []; 
    });
  }
}
