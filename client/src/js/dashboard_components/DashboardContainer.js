import React, { Component } from 'react';
import DataSection from './DataSection';
import Roster from './Roster';
import {
  calculateDashboardCheckinData,
  calculateDashboardStandupsData } from '../utilities'; 

class DashboardContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      students: [],
      allStandups: [],
      activeCheckins: []
    }
    this.getAuthToken = this.getAuthToken.bind(this);
  }

  getAuthToken() {
    return this.props
    .location
    .search
    .replace(/^(.*?)\auth_token=/, '');
  }
  
  componentDidMount(){
    fetch(`/api/students?access_token=${ this.getAuthToken() }`)
      .then(response => response.json())
      .then(data => {
        this.setState({ students: data });
      })
      .catch(err => console.log(err));
    
    fetch(`/api/standups?access_token=${ this.getAuthToken() }`)
      .then(response => response.json())
      .then(data => {
        this.setState({ allStandups: data });
      })
      .catch(err => console.log(err));

    fetch(`/api/checkins/active?access_token=${ this.getAuthToken() }`)
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

    let standupsData;
    let checkinData;
    if(this.state.students.length > 0) {
      standupsData = calculateDashboardStandupsData(
        this.state.allStandups,
        this.state.students
      );
      checkinData = calculateDashboardCheckinData(
        this.state.activeCheckins,
        this.state.students
      );
    }

    return (
      <React.Fragment>
        <header>
          <p className='date'>{`${ dayOfWeek }, ${ month } ${ dayOfMonth }`}</p>
          <ul className='navigation'>
            <li>
              <a 
                className='link-btn'
                href={`${ process.env.BASE_URL }logout?auth_token=${ this.getAuthToken() }`}
              >Logout
              </a>
            </li>
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
            <Roster
              students={ this.state.students }
              auth_token={ this.getAuthToken() }
            />
          </div>
        </main>
      </React.Fragment>
    );
  }
}

export default DashboardContainer;
