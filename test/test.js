var main = require('./main');
var gatewaySuite = require('./gateway');

describe('latam_payment', function describeLatamPayment() {
	describe('register', main.registerSuite);
	describe('tokenize', main.tokenizeSuite);
	describe('checkout', main.checkoutSuite);
	describe('gateway', gatewaySuite);
});
