var main = require('./main');
var gatewaySuite = require('./gateway');

describe('latam_payment', function describeLatamPayment() {
	describe('register', main.registerSuite);
	describe('gateway', gatewaySuite);
});
