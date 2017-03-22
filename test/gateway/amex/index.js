var createTokenSuite = require('./createToken');
var deleteTokenSuite = require('./deleteToken');
var getGatewayInfoSuite = require('./getGatewayInfo');

module.exports = function describeAmex() {
	describe('getGatewayInfo', getGatewayInfoSuite);
	describe('createToken', createTokenSuite);
	describe('deleteToken', deleteTokenSuite);
};
