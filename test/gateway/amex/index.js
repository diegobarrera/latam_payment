var credentials = {
	merchantId: 'TEST9353874515',
	password: 'd0f2cd569d431efcf62f5409cea56fd7',
};

var authorizeSuite = require('./authorize')(credentials);
var captureSuite = require('./capture')(credentials);
var createTokenSuite = require('./createToken')(credentials);
var deleteTokenSuite = require('./deleteToken')(credentials);
var getTokenSuite = require('./getToken')(credentials);
var getGatewayInfoSuite = require('./getGatewayInfo');
var refundSuite = require('./refund')(credentials);
var voidSuite = require('./void')(credentials);

module.exports = function describeAmex() {
	describe('getGatewayInfo', getGatewayInfoSuite);
	describe('createToken', createTokenSuite);
	describe('deleteToken', deleteTokenSuite);
	describe('getToken', getTokenSuite);
	describe('authorize', authorizeSuite);
	describe('void', voidSuite);
	describe('capture', captureSuite);
	describe('refund', refundSuite);
};
