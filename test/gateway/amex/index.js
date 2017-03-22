var authorizeSuite = require('./authorize');
var captureSuite = require('./capture');
var createTokenSuite = require('./createToken');
var deleteTokenSuite = require('./deleteToken');
var getTokenSuite = require('./getToken');
var getGatewayInfoSuite = require('./getGatewayInfo');
var refundSuite = require('./refund');
var voidSuite = require('./void');

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
