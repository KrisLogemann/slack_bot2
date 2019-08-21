import React from 'react';

function Delinquents(props) {
  return(
    <div className='delinquents'>
      <h4>{ props.title }</h4>
      <ul className='box'>
        { props.students.map(student => (
          <li key={ student.slack_id }>{ student.name }</li>
        )) }
        </ul>
    </div>
  );
}

export default Delinquents;
