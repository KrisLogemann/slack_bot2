'use strict';

module.exports = function(app) {
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  const findOrCreateUser =
    User.findOne({'where': {'email': process.env.ADMIN_EMAIL}})
      .then(user => {
        if (!user) {
          return User.create({
            username: process.env.ADMIN_USERNAME,
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
          })
        } else { return user; }
      })
      .catch(err => {
        console.log('unable to find or create an admin user');
        return err;
      });

  const findOrCreateRole = Role.findOne({'where': {'name': 'admin'}})
      .then(adminRole => {
        if (!adminRole) {
          return Role.create({
            name: 'admin',
          })
        } else { return adminRole; }
      })
      .catch(err => {
        console.log('unable to find or create an admin role');
        return err;
      });

  Promise.all([findOrCreateUser, findOrCreateRole])
    .then(response => {
      RoleMapping.findOne({'where': 
        {'principalId': response[0].id, 'roleId': response[1].id}})
        .then(roleMap => {
          if (!roleMap) {
            response[1].principals.create({
              principalType: RoleMapping.USER,
              principalId: response[0].id,
            })
          }
        });
    })
    .catch(() => console.log('unable to assign admin role to a user'));
};
