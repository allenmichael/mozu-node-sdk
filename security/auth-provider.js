/* global Promise */
'use strict';
var constants = require('../constants'),
    AuthTicket = require('./auth-ticket'),
    scopes = constants.scopes;

require('when/es6-shim/Promise.browserify-es6');

var makeAppAuthClient = (function() {
  var c;
  return function() {
    return (c || (c = require('../clients/platform/applications/authTicket'))).apply(this, arguments);
  };
}());

var makeDeveloperAuthClient = (function() {
  var c;
  return function() {
    return (c || (c = require('../clients/platform/developer/developerAdminUserAuthTicket'))).apply(this, arguments);
  };
}());

var makeAdminUserAuthClient = (function() {
  var c;
  return function() {
    return (c || (c = require('../clients/platform/adminuser/tenantAdminUserAuthTicket'))).apply(this, arguments);
  };
}());

function getPlatformAuthTicket(client) {
  return makeAppAuthClient(client).authenticateApp({
    applicationId: client.context.appKey,
    sharedSecret: client.context.sharedSecret
  }, {
    scope: scopes.NONE
  }).then(AuthTicket);
}

function refreshPlatformAuthTicket(client, ticket) {
  return makeAppAuthClient(client).refreshAppAuthTicket({
    refreshToken: ticket.refreshToken
  }, {
    scope: scopes.NONE
  }).then(AuthTicket);
}

function getDeveloperAuthTicket(client) {
  return makeDeveloperAuthClient(client).createDeveloperUserAuthTicket(client.context.developerAccount).then(function(json) {
    return new AuthTicket(json);
  });
}

function refreshDeveloperAuthTicket(client, ticket) {
  return makeDeveloperAuthClient(client).refreshDeveloperAuthTicket(ticket).then(AuthTicket);
}

function getAdminUserAuthTicket(client) {
  return makeAdminUserAuthClient(client).createUserAuthTicket({ tenantId: client.context.tenant }, { 
    body: client.context.adminUser,
    scope: constants.scopes.APP_ONLY
  }).then(function(json) {
    client.context.user = json.user;
    return new AuthTicket(json);
  });
}

function refreshAdminUserAuthTicket(client, ticket) {
  return makeAdminUserAuthClient(client).refreshAuthTicket(ticket, {
    scope: constants.scopes.APP_ONLY
  }).then(AuthTicket);
}

var calleeToClaimType = {
  'addPlatformAppClaims': 'application',
  'addDeveloperUserClaims': 'developer',
  'addAdminUserClaims': 'admin-user'
};

function makeClaimMemoizer(calleeName, requester, refresher, claimHeader) {
  return function(client) {
    var cacheAndUpdateClient = function(ticket) {
      return new Promise(function(resolve) {
        client.authenticationStorage.set(calleeToClaimType[calleeName], client.context, ticket, function() {
          client.context[claimHeader] = ticket.accessToken;
          resolve(client);
        });
      });
    };
    var op = new Promise(function(resolve) {
      client.authenticationStorage.get(calleeToClaimType[calleeName], client.context, function(err, ticket) {
        resolve(ticket);
      });
    }).then(function(ticket) {
      if (!ticket) {
        return requester(client).then(cacheAndUpdateClient);
      }
      if ((new Date(ticket.accessTokenExpiration)) < new Date()) {
        return refresher(client, ticket).then(cacheAndUpdateClient);
      }
      client.context[claimHeader] = ticket.accessToken;
      return client;
    });
    function setRecent() {
      AuthProvider.addMostRecentUserClaims = AuthProvider[calleeName];
    }
    op.then(setRecent, setRecent);
    return op;
  };
}


var AuthProvider = {

  addPlatformAppClaims: makeClaimMemoizer('addPlatformAppClaims', getPlatformAuthTicket, refreshPlatformAuthTicket, constants.headers.APPCLAIMS),
  addDeveloperUserClaims: makeClaimMemoizer('addDeveloperUserClaims', getDeveloperAuthTicket, refreshDeveloperAuthTicket, constants.headers.USERCLAIMS),
  addAdminUserClaims: makeClaimMemoizer('addAdminUserClaims', getAdminUserAuthTicket, refreshAdminUserAuthTicket, constants.headers.USERCLAIMS),
  addMostRecentUserClaims: false
};

module.exports = AuthProvider;