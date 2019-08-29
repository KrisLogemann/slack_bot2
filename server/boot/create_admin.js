'use strict';

module.exports = function(app) {
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  const findOrCreateUser =
    User.findOne({'where': {'email': process.env.ADMIN_EMAIL}})
      .then(user => {
        console.log('response from user search:', user);
        if (!user) {
          console.log('that user does not exist ... creating it now');
          return User.create({
            username: process.env.ADMIN_USERNAME,
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
          })
          .then(user => {
            console.log('created user:', user);
            return user;
          });
        } else { return user; }
      });

  const findOrCreateRole = Role.findOne({'where': {'name': 'admin'}})
      .then(adminRole => {
        console.log('response from role search: ', adminRole);
        if (!adminRole) {
          console.log('that role does not exist ... creating it now');
          return Role.create({
            name: 'admin',
          })
          .then(role => {
            console.log('Created role:', role);
            return role;
          });
        } else { return adminRole; }
      });

  Promise.all([findOrCreateUser, findOrCreateRole])
    .then(response => {
      console.log('response from promise:', response);
      RoleMapping.findOne({'where': 
        {'principalId': response[0].id, 'roleId': response[1].id}})
        .then(roleMap => {
          console.log('response from role mapping search: ', roleMap);
          if (!roleMap) {
            console.log('that role map does not exist ... creating it now');
            console.log(response[1]);
            response[1].principals.create({
              principalType: RoleMapping.USER,
              principalId: response[0].id,
            })
            .then(roleMap => console.log('Created role map:', roleMap));
          }
        });
    })
    .catch(err => console.log(err));
};
