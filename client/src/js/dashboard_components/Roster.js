import React from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom'

function Roster(props) {
  return(
    <section className='roster'>
      <h2 className='section-label'>View data for</h2>
      <ul className='student-links box'>
        { props.students.map(student => {
          const link = `/student-summary/${ student.id }`;
          return (
            <li key={ student.id }>
              <Link to={ link }>{ student.name }</Link>
            </li>
          )
        }) }
      </ul>
    </section>
  );
}

export default Roster;
