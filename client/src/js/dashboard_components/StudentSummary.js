import React, { Component } from 'react';
import Standup from './Standup';
import HamburgerNavigation from '../general_components/HamburgerNavigation';
import DataSection from './DataSection';

// mock data
const timeInClassData = [
  { featured: '30', measurement: 'hrs', footer: '7 days'},
  { featured: '22', measurement: 'hrs', footer: 'weekly average'},
  { featured: '130', measurement: 'hrs', footer: 'total'}
];
// end mock data

class Standups extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      standups: []
    }
  }

  componentDidMount() {
    const id = this.props.location.pathname.replace('/student-summary/', '');
    fetch(`/api/students/${id}`)
      .then(response => response.json()
      .then(data => {
        this.setState({ name: data.name });
        fetch(`/api/students/${data.id}/standups`)
          .then(response => response.json())
          .then(standups => {
            this.setState({ standups });
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err)));
  }

  render() {
    let standupsData;
    let standupsComponent;
    if(this.state.standups.length > 0) {
      standupsData = calculateStandupsData(this.state.standups);
      standupsComponent = this.state.standups.reverse().map(standup => (
        <Standup key={standup.id} standup={standup}/>
      ));
    } else {
      standupsComponent = 
        <div className='standup-card'>{ `${ this.state.name } has not submitted any standups.`}</div>
    }
    return(
      <React.Fragment>
        <header>
          <h1>{ this.state.name }</h1>
          <HamburgerNavigation />
        </header>
        <main className='wrapper'>
          <div className='data-section-container-grid'>
            <DataSection title='time in class' data={ timeInClassData }/>
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

function calculateStandupsData(standups) {
  // Summary of standups completed in the last seven days
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const midnightSevenDaysAgo = new Date(`${year}-${month}-${day - 7}`);

  const weekOfStandups = standups.filter(standup => {
    return new Date(standup.date) > midnightSevenDaysAgo;
  });

  const weekOfStandupsPercent = Math.round((weekOfStandups.length / 7) * 100);

  // Summary of standups completed during entire enrollment (assuming standup submitted on day 1)
  const firstStandup = standups[0];
  const dayOne = new Date(firstStandup.date);
  const totalDaysEnrolled = (Math.round((today - dayOne) / (1000*60*60*24))) + 1; // math is done in milliseconds
  const averageStandupPercent = 
    Math.round((standups.length / totalDaysEnrolled) * 100);

  return ([
    { 
      featured: `${ weekOfStandupsPercent }%`,
      fraction: `${ weekOfStandups.length } / 7`,
      footer: '7 days' 
    },{ 
      featured: `${ averageStandupPercent }%`,
      fraction: `${ standups.length } / ${ totalDaysEnrolled }`,
      footer: 'average'
    }
  ]);
}

export default Standups;
