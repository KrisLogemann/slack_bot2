import React, { Component } from 'react';

function HamburgerNavigation(props) {
  return(
    <React.Fragment>
      <div className='hamburger' onClick={ toggleMenu }><div></div></div>
      <ul className='navigation hamburger-navigation'>
        <li><a className='link-btn' href='/logout'>Logout</a></li>
        <li><a className='link-btn' href='/dashboard'>Dashboard</a></li>
      </ul>
    </React.Fragment>
  );
}

function toggleMenu() {
  const nav = document.getElementsByClassName('hamburger-navigation')[0];
  if(nav.classList.contains('visible')) {
    nav.classList.remove('visible')
  } else {
    nav.classList.add('visible');
  }
}

export default HamburgerNavigation;
