

//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by CodeZu.     
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

var Client = require('../../../client'), constants = Client.constants;


module.exports = Client.sub({
	createDeveloperUserAuthTicket: Client.method({
		method: constants.verbs.POST,
		url: '{+homePod}api/platform/developer/authtickets/?developerAccountId={developerAccountId}&responseFields={responseFields}'
	}),
	refreshDeveloperAuthTicket: Client.method({
		method: constants.verbs.PUT,
		url: '{+homePod}api/platform/developer/authtickets/?developerAccountId={developerAccountId}&responseFields={responseFields}'
	}),
	deleteUserAuthTicket: Client.method({
		method: constants.verbs.DELETE,
		url: '{+homePod}api/platform/developer/authtickets/?refreshToken={refreshToken}'
	})
});