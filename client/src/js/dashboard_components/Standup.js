import React from 'react';

function Standup(props) {
  const date = new Date(props.standup.date);
  const formattedDate = 
    "0" + (date.getMonth() + 1).toString().substr(-2)
    + "/" + ("0" + date.getDate().toString()).substr(-2)
    + "/" + (date.getFullYear().toString()).substr(2);
  
  return(
    <div className='standup-card'>
      <p className='standup-card-title'>{ formattedDate }</p>
      <div className='standup-card-content'>
        <p className='standup-question'>What have you done since yesterday?</p>
        <p className='standup-response'>{ props.standup.tasks_yesterday }</p>
      </div>
      <div className='standup-card-content'>
        <p className='standup-question'>What will you do today?</p>
        <p className='standup-response'>{ props.standup.tasks_today }</p>
      </div>
      <div className='standup-card-content'>
        <p className='standup-question'>Blockers?</p>
        <p className='standup-response'>{ props.standup.blockers }</p>
      </div>
    </div>
  );
}

export default Standup;
