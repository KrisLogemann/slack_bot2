import React, { Component } from 'react';
import DataSection from './DataSection';
import Roster from './Roster';

class DashboardContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      students: [],
      allStandups: [],
      activeCheckins: []
    }
  }

  componentDidMount(){
    fetch('/api/students')
      .then(response => response.json())
      .then(data => {
        this.setState({ students: data });
      })
      .catch(err => console.log(err));
    
    fetch('/api/standups')
      .then(response => response.json())
      .then(data => {
        this.setState({ allStandups: data });
      })
      .catch(err => console.log(err));

    fetch('/api/checkins/active')
      .then(response => response.json())
      .then(data => {
        this.setState({ activeCheckins: data });
      })
      .catch(err => console.log(err));
  }

  render() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const today = new Date();
    const dayOfWeek = days[today.getDay()];
    const month = months[today.getMonth()];
    const dayOfMonth = today.getDate();
    const midnight = new Date(`${today.getFullYear()}-${month}-${today.getDate()}`);

    let standupsData;
    let checkinData;
    if(this.state.allStandups.length > 0 && this.state.students.length > 0) {
      standupsData = calculateStandupsData(this.state.allStandups, this.state.students, midnight);
    }
    if(this.state.activeCheckins.length > 0 && this.state.students.length > 0) {
      checkinData = calculateCheckinData(this.state.activeCheckins, this.state.students);
    }

    return (
      <React.Fragment>
        <header>
          <p className='date'>{`${dayOfWeek}, ${month} ${dayOfMonth}`}</p>
          <ul className='navigation'>
            <li><a className='link-btn' href='login.html'>Logout</a></li>
          </ul>
        </header>
        <main className='wrapper dashboard-wrapper'>
          <div className='data-section-container-flex'>
            <DataSection
              title='time in class'
              data={ checkinData ? checkinData.summary : undefined }
              delinquents={ checkinData ? checkinData.delinquents : undefined }
              delinquentTitle = 'absentees'
            />
            <DataSection
              title='standups'
              data={ standupsData ? standupsData.summary : undefined }
              delinquents={ standupsData ? standupsData.delinquents : undefined }
            />
          </div>
          <div className='grid-column'>
            <Roster students={ this.state.students } />
          </div>
        </main>
      </React.Fragment>
    );
  }
}

function calculateStandupsData(standups, students, today) {
  const todaysStandups = standups.filter(standup => {
    return new Date(standup.date) > today
  });

  const delinquents = students.filter(student => {
    return !todaysStandups.some(standup => {
        return student.id === standup.studentId;
      });
  });

  const todaysStandupPercent = Math.round((todaysStandups.length / students.length) * 100);

  return {
    summary: [
      { 
        featured: `${todaysStandupPercent}%`,
        fraction: `${todaysStandups.length} / ${students.length}`,
        footer: 'today'
      }
    ],
    delinquents
  }
}

function calculateCheckinData(activeCheckins, students) {
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
        footer: 'checked in'
      }
    ],
    delinquents: absentees
  }
}

export default DashboardContainer;
