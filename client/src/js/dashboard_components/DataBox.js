import React from 'react';

function DataBox(props) {
  let midline;
  if(props.data.fraction) {
    midline = <p className='fraction'>{ props.data.fraction }</p>
  } else if (props.data.measurement) {
    midline = <span>{ props.data.measurement }</span>
  }

  return(
    <div className='center-data box'>
      <div className='data'>
        <span className='featured-data'>{ props.data.featured }</span>
        { midline }
        <p>{ props.data.footer }</p>
      </div>
    </div>
  );
}

export default DataBox;
