import React from 'react';
import DataBox from './DataBox';
import Delinquents from './Delinquents';

function DataSection(props) {
  let delinquents;
  let boxes;

  if(props.delinquents) {
    delinquents =
      (<Delinquents 
        title={ props.delinquentTitle ? props.delinquentTitle : 'delinquents' }
        students={ props.delinquents }
      />)
  }

  if(props.data) {
    boxes = props.data.map(data => (
      <DataBox key={data.footer} data={ data } /> 
    ));
  } else {
    boxes = <p>No data available</p>
  }
  
  return(
    <section className='data-section data-section-flex'>
      <h2 className='section-label'>{ props.title }</h2>
      <div className='data-container'>
        { boxes }
      </div>
      { delinquents }
    </section>
  );
}

export default DataSection;
