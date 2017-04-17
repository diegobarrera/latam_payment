var amexSuite = require('./amex');
var payuSuite = require('./payu');
var stripeSuite = require('./stripe');

module.exports = function describeGateway() {
	describe('amex', amexSuite);
	describe('payu', payuSuite);
	describe('stripe', stripeSuite);
};
