const today = new Date();
const tomorrowMidnight = new Date(
  `${today.getFullYear()}-
  ${today.getMonth() + 1}-
  ${today.getDate() + 1}`
);
const sevenDaysAgoMidnight = new Date(
  `${today.getFullYear()}-
  ${today.getMonth() + 1}-
  ${today.getDate() - 6}`
);

const millisecondsToHours = 1000*60*60;
const millisecondsToDays = 1000*60*60*24;

function calculateStandupsData(standups) {
  if(standups.length == 0) { return undefined }

  // standups completed in the last seven days
  const standupsLastSevenDays = standups.filter(standup => {
    return new Date(standup.date) > sevenDaysAgoMidnight;
  });
  const uniqueStandupsLastSevenDays = 
    [...new Set(standupsLastSevenDays.map(standup => standup.date))];

  const weekOfStandupsPercent = 
    Math.round((standupsLastSevenDays.length / 7) * 100);

  // standups completed during entire enrollment (assuming standup submitted on day 1)
  const dayOne = new Date(standups[standups.length - 1].date);
  const dayOneMidnight = new Date(
    `${dayOne.getFullYear()}-
    ${dayOne.getMonth() + 1}-
    ${dayOne.getDate()}`
  );
  const totalDaysEnrolled = 
    Math.round((today - dayOneMidnight) / millisecondsToDays);
  const daysWithStandups = [...new Set(standups.map(standup => standup.date))];
  const averageStandupPercent = 
    Math.round((daysWithStandups.length / totalDaysEnrolled) * 100);

  return ([
    { 
      featured: `${ weekOfStandupsPercent }%`,
      fraction: `${ uniqueStandupsLastSevenDays.length } / 7`,
      footer: '7 days' 
    },{ 
      featured: `${ averageStandupPercent }%`,
      fraction: `${ daysWithStandups.length } / ${ totalDaysEnrolled }`,
      footer: 'average'
    }
  ]);
}

function calculateCheckinData(checkins) {
  if(checkins.length == 0) { return undefined }
  
  // total time spent in classroom
  checkins.forEach(checkin => {
    if(!checkin.checkout_time) { 
      checkin.hours = (new Date() - new Date(checkin.checkin_time))
      / millisecondsToHours;
    }
  })
  let totalHours = checkins.reduce((accumulator, checkin) => {
    return accumulator + checkin.hours;
  }, 0);
  totalHours = Math.round(totalHours);
  
  // weekly average = daily average * 7
  const dayOne = new Date(checkins[0].checkin_time);
  const dayOneMidnight = new Date(
    `${dayOne.getFullYear()}-
    ${dayOne.getMonth() + 1}-
    ${dayOne.getDate()}`
  );
  const totalDaysEnrolled = 
    Math.round((tomorrowMidnight - dayOneMidnight) / millisecondsToDays);
  const weeklyAverageHours = Math.round(totalHours / totalDaysEnrolled * 7);

  // time spent in classroom in the last seven days
  const checkinsLastSevenDays = checkins.filter(checkin => {
    return new Date(checkin.checkin_time) > sevenDaysAgoMidnight;
  });
  let timeSpentLastSevenDays = 
    checkinsLastSevenDays.reduce((accumulator, checkin) => {
      return accumulator + checkin.hours;
    } ,0);
  timeSpentLastSevenDays = Math.round(timeSpentLastSevenDays);

  return ([
    { 
      featured: `${timeSpentLastSevenDays}`,
      measurement: 'hrs',
      footer: '7 days'
    },{
      featured: `${weeklyAverageHours}`,
      measurement: 'hrs',
      footer: 'weekly average'
    },{ 
      featured: `${totalHours}`,
      measurement: 'hrs',
      footer: 'total'
    }
  ]);
}

module.exports = { calculateStandupsData, calculateCheckinData };