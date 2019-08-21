import React from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import DashboardContainer from './DashboardContainer';
import StudentSummary from './StudentSummary';

function DashboardApp(props) {
  return (
    <Router>
      <Route exact path='/dashboard' component={ DashboardContainer} />
      <Route path='/student-summary/:id' component={ StudentSummary } />
    </Router>
  );
}

export default DashboardApp;
