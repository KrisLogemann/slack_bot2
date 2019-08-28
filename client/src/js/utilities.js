'use strict';

const today = new Date();
const todayMidnight = new Date(
  `${today.getFullYear()}-
  ${today.getMonth() + 1}-
  ${today.getDate()}`
);
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

const millisecondsToHours = 1000 * 60 * 60;
const millisecondsToDays = 1000 * 60 * 60 * 24;

function calculateDashboardStandupsData(standups, students) {
  const todaysStandups = standups.filter(standup => {
    return new Date(standup.date) > todayMidnight;
  });
  const uniqueStandupsToday = [...new Set(todaysStandups.map(standup => {
    return standup.slack_id;
  }))];
  const delinquents = students.filter(student => {
    return !uniqueStandupsToday.some(slackId => {
      return student.slack_id === slackId;
    });
  });
  const todaysStandupPercent = Math.round((uniqueStandupsToday.length /
    students.length) * 100);

  return {
    summary: [
      {
        featured: `${todaysStandupPercent}%`,
        fraction: `${uniqueStandupsToday.length} / ${students.length}`,
        footer: 'today',
      },
    ],
    delinquents,
  };
}

function calculateDashboardCheckinData(activeCheckins, students) {
  // assumes a student cannot have more than one active checkin
  const checkinPercent =
    Math.round((activeCheckins.length / students.length) * 100);

  const absentees = students.filter(student => {
    return !activeCheckins.some(checkin => {
      return student.slack_id === checkin.slack_id;
    });
  });

  return {
    summary: [
      {
        featured: `${ checkinPercent }%`,
        fraction: `${ activeCheckins.length } / ${ students.length }`,
        footer: 'checked in',
      },
    ],
    delinquents: absentees,
  };
}

function calculateIndividualStandupsData(standups) {
  if (standups.length == 0) { return undefined; }

  // standups completed in the last seven days
  const standupsLastSevenDays = standups.filter(standup => {
    return new Date(standup.date) > sevenDaysAgoMidnight;
  });
  const standupsLastSevenDaysDates = standupsLastSevenDays.map(standup => {
    const standupDate = new Date(standup.date);
    return (
      `${standupDate.getFullYear()}-
      ${standupDate.getMonth() + 1}-
      ${standupDate.getDate()}`
    );
  });
  const uniqueStandupsLastSevenDays =
    [...new Set(standupsLastSevenDaysDates)];

  const weekOfStandupsPercent =
    Math.round((uniqueStandupsLastSevenDays.length / 7) * 100);

  // standups completed during entire enrollment (assuming standup submitted on day 1)
  const dayOne = new Date(standups[standups.length - 1].date);
  const dayOneMidnight = new Date(
    `${dayOne.getFullYear()}-
    ${dayOne.getMonth() + 1}-
    ${dayOne.getDate()}`
  );
  const totalDaysEnrolled =
    Math.round((tomorrowMidnight - dayOneMidnight) / millisecondsToDays);
  const standupsDates = standups.map(standup => {
    const standupDate = new Date(standup.date);
    return (
      `${standupDate.getFullYear()}-
      ${standupDate.getMonth() + 1}-
      ${standupDate.getDate()}`
    );
  });
  const uniqueDaysWithStandups = [...new Set(standupsDates)];
  const averageStandupPercent =
    Math.round((uniqueDaysWithStandups.length / totalDaysEnrolled) * 100);

  return ([
    {
      featured: `${ weekOfStandupsPercent }%`,
      fraction: `${ uniqueStandupsLastSevenDays.length } / 7`,
      footer: '7 days',
    }, {
      featured: `${ averageStandupPercent }%`,
      fraction: `${ uniqueDaysWithStandups.length } / ${ totalDaysEnrolled }`,
      footer: 'average',
    },
  ]);
}

function calculateIndividualCheckinData(checkins) {
  if (checkins.length == 0) { return undefined; }

  // total time spent in classroom
  checkins.forEach(checkin => {
    if (!checkin.checkout_time) {
      checkin.hours = (new Date() - new Date(checkin.checkin_time)) /
        millisecondsToHours;
    }
  });
  let totalHours = checkins.reduce((accumulator, checkin) => {
    return accumulator + checkin.hours;
  }, 0);
  totalHours = Math.round(totalHours);

  // weekly average = daily average * 7, but only if student has already been
  // enrolled for at least one week
  const dayOne = new Date(checkins[0].checkin_time);
  const dayOneMidnight = new Date(
    `${dayOne.getFullYear()}-
    ${dayOne.getMonth() + 1}-
    ${dayOne.getDate()}`
  );
  const totalDaysEnrolled =
    Math.round((tomorrowMidnight - dayOneMidnight) / millisecondsToDays);
  let weeklyAverageHours;
  if (totalDaysEnrolled <= 7) {
    weeklyAverageHours = totalHours;
  } else {
    weeklyAverageHours = Math.round(totalHours / totalDaysEnrolled * 7);
  }

  // time spent in classroom in the last seven days
  const checkinsLastSevenDays = checkins.filter(checkin => {
    return new Date(checkin.checkin_time) > sevenDaysAgoMidnight;
  });
  let timeSpentLastSevenDays =
    checkinsLastSevenDays.reduce((accumulator, checkin) => {
      return accumulator + checkin.hours;
    }, 0);
  timeSpentLastSevenDays = Math.round(timeSpentLastSevenDays);

  return ([
    {
      featured: `${timeSpentLastSevenDays}`,
      measurement: 'hrs',
      footer: '7 days',
    }, {
      featured: `${weeklyAverageHours}`,
      measurement: 'hrs',
      footer: 'weekly average',
    }, {
      featured: `${totalHours}`,
      measurement: 'hrs',
      footer: 'total',
    },
  ]);
}

module.exports = {
  calculateDashboardCheckinData,
  calculateDashboardStandupsData,
  calculateIndividualStandupsData,
  calculateIndividualCheckinData,
};
