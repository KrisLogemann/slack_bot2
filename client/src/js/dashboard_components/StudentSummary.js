import React, { Component } from 'react';
import Standup from './Standup';
import HamburgerNavigation from '../general_components/HamburgerNavigation';
import DataSection from './DataSection';
import {
  calculateIndividualCheckinData,
  calculateIndividualStandupsData } from '../utilities';

class Standups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      standups: [],
      checkinHistory: []
    }
    this.getAuthToken = this.getAuthToken.bind(this);
  }

  getAuthToken() {
    return this.props
    .location
    .search
    .replace(/^(.*?)\auth_token=/, '');
  }

  componentDidMount() {
    const id = this.props.location.pathname.replace('/student-summary/', '');

    fetch(`/api/students/${ id }?access_token=${ this.getAuthToken() }`)
      .then(response => response.json())
      .then(student => {
        this.setState({ name: student.name });

        fetch(`/api/students/${ student.id }/standups?access_token=${ this.getAuthToken() }`)
          .then(response => response.json())
          .then(standups => {
            this.setState({ standups: standups.reverse() });
          })
          .catch(err => console.log(err));

        fetch(`/api/checkins/slackId/${ student.slack_id }?access_token=${ this.getAuthToken() }`)
          .then(response => response.json())
          .then(checkins => {
            this.setState({ checkinHistory: checkins });
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  }

  render() {
    let standupsComponent;
    let standupsData = calculateIndividualStandupsData(this.state.standups);
    let checkinData = calculateIndividualCheckinData(this.state.checkinHistory);
    if(this.state.standups.length > 0) {
      standupsComponent = this.state.standups.map(standup => (
        <Standup key={ standup.id } standup={ standup }/>
      ));
    } else {
      standupsComponent = 
        <div className='standup-card'>
          {`${ this.state.name } has not submitted any standups.`}
        </div>
    }
    return(
      <React.Fragment>
        <header>
          <h1>{ this.state.name }</h1>
          <HamburgerNavigation auth_token={ this.getAuthToken() }/>
        </header>
        <main className='wrapper'>
          <div className='data-section-container-grid'>
            <DataSection title='time in class' data={ checkinData }/>
            <DataSection title='standups completed' data={ standupsData }/>
          </div>
          <section className='standups'>
            <h2 className='section-label'>standups</h2>
            <div className='standup-container'>
              { standupsComponent }
            </div>
          </section>
        </main>
      </React.Fragment>
    );
  }
}

export default Standups;
