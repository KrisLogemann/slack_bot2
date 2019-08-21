import React from 'react';

function AdminLogin(props) {
  return(
    <React.Fragment>
      <h1>Admin Dashboard</h1>
      <form>
        <input type='text' placeholder='Username' />
        <input type='password' placeholder='Password' />
        <input type='submit' value='Login' className='link-btn' />
      </form>
      <div className='auth'>
        <p>Log in using your account on:</p>
        <a href='auth/google' className='google'></a>
      </div>
    </React.Fragment>
  );
}

export default AdminLogin;
