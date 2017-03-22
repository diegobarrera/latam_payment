var createTokenSuite = require('./createToken');
var getGatewayInfoSuite = require('./getGatewayInfo');

module.exports = function describeAmex() {
	describe('getGatewayInfo', getGatewayInfoSuite);
	describe('createToken', createTokenSuite);
};
