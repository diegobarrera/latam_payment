var payuSuite = require('./payu');
var stripeSuite = require('./stripe');
require('index.js');

module.exports = function describeGateway() {
	describe('payu', payuSuite);
	describe('stripe', stripeSuite);
};
