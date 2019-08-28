/* eslint-disable max-len */
'use strict';

const axios = require('axios');
const bot = require('../bot');

//let checkedIn = [];
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
    app.models.checkin.active((err, response) => {
      if(err) { 
        console.log(err); 
      }
      else {
        let checkedInStudents = response;
        bot.getUsers()
          .then( users => {
            users.members.forEach(user => {
              if( checkedInStudents.filter(e=>e.slack_id===user.id).length > 0 ) {
                bot.postEphemeral(
                  process.env.STUDENTS_CHANNEL, 
                  user.id, 
                  ':alarm_clock: Don\'t forget to check in'
                );
              }
            });
          });
      }
    });
  });

  // 5:50pm
  const earlyCheckOutReminder = schedule.scheduleJob({hour: 17, minute: 50}, () => {
    app.models.checkin.active((err, response) => {
      if(err) { 
        console.log(err); 
      }
      else {
        let checkedInStudents = response;
        bot.getUsers()
          .then( users => {
            users.members.forEach(user => {
              if( checkedInStudents.filter(e=>e.slack_id===user.id).length > 0 ) {
                bot.postEphemeral(
                  process.env.STUDENTS_CHANNEL, 
                  user.id, 
                  ':alarm_clock: Don\'t forget to check out before you leave'
                  );
              }
            });
          });
      }
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

    app.models.checkin.active((err, response) => {
      if(err) { 
        console.log(err); 
      }
      else {
        let checkedInStudents = response;
        bot.getUsers()
          .then( users => {
            users.members.forEach(user => {
              if( checkedInStudents.filter(e=>e.slack_id===user.id).length > 0 ) {
                bot.postEphemeral(process.env.STUDENTS_CHANNEL, user.id, '', message);
              }
            });
          });
      }
    });
  });

  // 6:20pm
  const checkOutCache = schedule.scheduleJob({hour: 18, minute: 20}, () => {
    let checkouts = [];
    app.models.checkin.active((err, response) => {
      if(err) { console.log(new Error().lineNumber, err) }
      checkouts = response.map(checkin => {
        return app.models.checkin.updateAll(
          { id: checkin.id },
          { checkout_time: new Date(),
            hours: (new Date() - new Date(checkin.checkin_time)) / (1000*60*60)
            // (milliseconds in a sec) * (seconds in a min) * (minutes in an hour)
          }
        )
        .then(response => response)
      });
    });
    Promise.all(checkouts)
      .catch(new Error().lineNumber, err);
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

  function standup(userSlackId, channel, trigger_id) {
    let currentStudent = students.find(s => s.slack_id === userSlackId);

    if (currentStudent != undefined && !currentStudent.submitted) {
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
      bot.postEphemeral(channel, userSlackId, 'You have already submitted your standup for today.', params);
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
        'slack_id': user,
        'date': newDate,
        'tasks_yesterday': submission.yesterday,
        'tasks_today': submission.today,
        'blockers': submission.blockers,
        'studentId': student[0].id,
      });
    })
    .catch(err => console.log(err));

    const updateStudentStandup = app.models.student.updateAll(
      {slack_id: user},
      {'date-of-last-standup': newDate})
      .catch(err => console.log(err))
    
    Promise.all([addStandup, updateStudentStandup])
      .catch(err => console.log(err));

    bot.postEphemeral(channel, user, 'Have a great day!', params);
    adminReport();
  };

  function checkIn(slackId, loc, channel) {
    // check the active checkins to see if the current user is already checked in
    app.models.checkin.active((err, response) => {
      if(err) { 
        let thisline = new Error().lineNumber;
        console.log(thisline,err);
      }
      else if( response.filter(e => e.slack_id === slackId).length > 0 ){
        var params = {
          icon_emoji: ':x:',
        };
        bot.postEphemeral(channel, slackId, 'You have already checked in!', params);
      }
      else {
        // post message "you have checked in"
        const isNearby = 
          (loc.lat && loc.long) && (Math.abs(loc.lat - process.env.LAT) < 
          0.0001 && Math.abs(loc.long - process.env.LONG) < 0.0001);

          app.models.checkin
          .create({
            slack_id: slackId,
            checkin_time: new Date(),
            checkout_time: null,
            hours: 0
          })
          .then(response => {
            app.models.log.checkIn( slackId, loc.lat, loc.long, (err,resp) => {
              if(err) { 
                let thisline = new Error().lineNumber;
                console.log(thisline,err);
                var params = {
                  icon_emoji: ':x:',
                };
                bot.postEphemeral(channel, slackId, 'You have already checked in!', params);
              }
              else{
                var params = {
                  icon_emoji: ':heavy_check_mark:',
                };
                bot.postEphemeral(channel, slackId, 'You have checked in!', params);
                if (process.env.EXTERNAL_LOGGING) {
                  axios.post(process.env.EXTERNAL_LOGGING_URL,{
                      slackId,
                      method: 'checkin',
                      loc,
                      isNearby,
                      token: process.env.EXTERNAL_LOGGING_TOKEN,
                    }
                  );
                };
              }
            });
          })
          .catch(err => { let thisline = new Error().lineNumber; console.log(thisline,err); });
      }
    });
  };

  function checkOut(slackId, loc, channel, penalty = 'none') {
    let checkouts = [];
    app.models.checkin.active((err, response) => {
      if(err) {
        console.log(err);
      } 
      else {
        let userCheckedIn = response.filter(e => e.slack_id === slackId);
        if (userCheckedIn.length===0){
          var params = {
            icon_emoji: ':x:',
          };
          bot.postEphemeral(channel, slackId, 'You have not checked in!', params);
        } 
        else {
          const isNearby = (loc.lat && loc.long) && (Math.abs(loc.lat - process.env.LAT) < 0.0001 && Math.abs(loc.long - process.env.LONG) < 0.0001);
          if (penalty === 'none' && !isNearby) {
            penalty = 'notAtSchool';
          }
          checkouts = userCheckedIn.map(checkin => {
            return app.models.checkin.updateAll(
              { id: checkin.id },
              { checkout_time: new Date(),
                hours: (new Date() - new Date(checkin.checkin_time)) / (1000*60*60)
                // (milliseconds in a sec) * (seconds in a min) * (minutes in an hour)
              }
            )
            .then(response => response)
          });

          var params = {
            icon_emoji: ':heavy_check_mark:',
          };
          bot.postEphemeral(channel, slackId, penalty === 'timeout' ? ':warning: You have been automatically checked out.' : 'You have checked out!', params);
          if (process.env.EXTERNAL_LOGGING) {
            axios.post( process.env.EXTERNAL_LOGGING_URL, {
              slackId,
              method: 'checkout',
              loc,
              isNearby,
              token: process.env.EXTERNAL_LOGGING_TOKEN,
            });
          }
        }
      }
    });
    Promise.all(checkouts).then().catch(err => console.log(err));
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

  // djl, debug
  // 5:50pm
  if( process.env.DEBUG_EARLY_WARNING >= 1 && process.env.DEBUG_EARLY_WARNING <= 30 ) {
    console.log();
    console.log('Debug process.env.DEBUG_EARLY_WARNING set to every', process.env.DEBUG_EARLY_WARNING, 'minute(s).');
    console.log();
    const debugEarlyCheckOutReminder = schedule.scheduleJob(`*/${process.env.DEBUG_EARLY_WARNING} * * * *`, () => {

      console.log();
      console.log('Debug process.env.DEBUG_EARLY_WARNING doing the every', process.env.DEBUG_EARLY_WARNING, 'minute(s).');
      console.log();  

      app.models.checkin.active((err, response) => {
        if(err) { 
          console.log(err); 
        }
        else {
          let checkedInStudents = response;
          //djl
          console.log('checkedInStudents:');
          console.log(checkedInStudents);
          if(checkedInStudents.length){
            console.log('checkedInStudents.length:',checkedInStudents.length)
            bot.getUsers()
              .then( users => {
                users.members.forEach(user => {
                  if( checkedInStudents.filter(e=>e.slack_id===user.id).length > 0 ) {
                    console.log('debug early warning to:', user.id, user.real_name)
                    bot.postEphemeral(
                      process.env.STUDENTS_CHANNEL, 
                      user.id,
                      ':alarm_clock: Don\'t forget to check out before you leave'
                    );
                  }
                });
              });
          }
        }
      });
    });
  }

  // djl, debug
  // 6:15pm
  if( process.env.DEBUG_LATE_REMINDER >= 1 && process.env.DEBUG_LATE_REMINDER <= 30 ) {
    console.log();
    console.log('Debug process.env.DEBUG_LATE_REMINDER set to every', process.env.DEBUG_LATE_REMINDER, 'minute(s).');
    console.log();
    const DebugLateCheckOutReminder = schedule.scheduleJob(`*/${process.env.DEBUG_LATE_REMINDER} * * * *`, () => {

      console.log();
      console.log('Debug process.env.DEBUG_LATE_REMINDER doing the  every', process.env.DEBUG_LATE_REMINDER, 'minute(s).');
      console.log();

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

      app.models.checkin.active((err, response) => {
        if(err) { 
          console.log(err); 
        }
        else {
          let checkedInStudents = response;
          //djl
          console.log('checkedInStudents:');
          console.log(checkedInStudents);
          if(checkedInStudents.length){
            console.log('checkedInStudents.length:',checkedInStudents.length)
            bot.getUsers()
              .then( users => {
                users.members.forEach(user => {
                  if( checkedInStudents.filter(e=>e.slack_id===user.id).length > 0 ) {
                    console.log('debug later reminder to:', user.id, user.real_name);
                    bot.postEphemeral(process.env.STUDENTS_CHANNEL, user.id, '', message);
                  }
                });
              });
          }
        }
      });
    });
  }

  // djl, debug
  // every X minute checkout test
  if( process.env.DEBUG_AUTO_CHECKOUT >= 1 && process.env.DEBUG_AUTO_CHECKOUT <= 30 ) {
    console.log();
    console.log('Debug process.env.DEBUG_AUTO_CHECKOUT set to every', process.env.DEBUG_AUTO_CHECKOUT, 'minute(s).');
    console.log();
    const autoCheckout = schedule.scheduleJob(`*/${process.env.DEBUG_AUTO_CHECKOUT} * * * *`, () => {

      console.log();
      console.log('Debug process.env.DEBUG_AUTO_CHECKOUT doing the every', process.env.DEBUG_AUTO_CHECKOUT, 'minute(s).');
      console.log();

      let checkouts = [];
      app.models.checkin.active((err, response) => {
        if(err) { console.log(new Error().lineNumber, err) }
        checkouts = response.map(checkin => {
          console.log('debug auto checkout:', checkin.slack_id);

          return app.models.checkin.updateAll(
            { id: checkin.id },
            { checkout_time: new Date(),
              hours: (new Date() - new Date(checkin.checkin_time)) / (1000*60*60)
              // (milliseconds in a sec) * (seconds in a min) * (minutes in an hour)
            }
          )
          .then(response => response)
        });
      });
      Promise.all(checkouts)
        .catch(err=> console.log(new Error().lineNumber, err));
    });
  }
}
