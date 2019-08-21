import React, { Component } from 'react';
import DataSection from './DataSection';
import Roster from './Roster';

class DashboardContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      students: [],
      allStandups: []
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

    let standupsData
        timeInClassData;
    if(this.state.allStandups.length > 0 && this.state.students.length > 0) {
      standupsData = calculateStandupsData(this.state.allStandups, this.state.students, midnight);
    }

    // mock data
    const timeInClassData = {
      summary: [
        { featured: '50%', fraction: '10 / 20', footer: 'checked in'}
      ],
      delinquents: [
        { name: 'Student 1', slack_id: '123' },
        { name: 'Student 2', slack_id: '234' },
        { name: 'Student 3', slack_id: '345' },
        { name: 'Student 4', slack_id: '456' },
        { name: 'Student 5', slack_id: '567' },
        { name: 'Student 6', slack_id: '678' },
        { name: 'Student 7', slack_id: '789' },
        { name: 'Student 8', slack_id: '890' },
        { name: 'Student 9', slack_id: '901' },
        { name: 'Student 10', slack_id: '012' }
      ]
    }
    // end mock data

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
              data={ timeInClassData ? timeInClassData.summary : undefined }
              delinquents={ timeInClassData ? timeInClassData.delinquents : undefined }
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

export default DashboardContainer;
