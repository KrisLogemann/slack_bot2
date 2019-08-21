'use strict';

module.exports = {
  'google-login': {
    'provider': 'google',
    'module': 'passport-google-oauth',
    'strategy': 'OAuth2Strategy',
    'clientID': process.env.GOOGLE_ID,
    'clientSecret': process.env.GOOGLE_SECRET,
    'callbackURL': '/auth/google/callback',
    'authPath': '/auth/google',
    'callbackPath': '/auth/google/callback',
    'successRedirect': '/dashboard',
    'failureRedirect': '/login',
    'scope': ['email', 'profile'],
    'failureFlash': true,
  },
};
