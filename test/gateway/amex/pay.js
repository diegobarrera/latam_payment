var expect = require('chai').expect;
var uuid = require('node-uuid');
var amex = require('gateway/amex');

var orderId;

function paySuite(credentials) {
	afterEach(function afterEach(done) {
		var payload = {
			payment: {
				amount: 500,
				currency: 'MXN',
			},
		};
		amex.refund(orderId, payload, credentials, function() {
			done();
		});
	});
	it('Make single-step payment', function test(done) {
		orderId = uuid.v1();
		var payload = {
			email: 'test@email.com',
			payment: {
				internal_reference: 'ABC12398',
				amount: 500,
				currency: 'MXN',
				source: {
					card: '345678156470007',
				},
			},
			metadata: {
				id: '123456789',
				first_name: 'John',
				last_name: 'Doe',
				phone: '123456789',
				country: 'MEX',
				city: 'MEX',
			},
			address: {
				line1: 'Av. Insurgentes Sur 253',
				country: 'MEX',
				city: 'MEX',
			},
		};
		amex.pay(orderId, payload, credentials, function(err, body) {
			expect(err).to.not.exist;
			expect(body.order.status).to.equal('CAPTURED');
			expect(body.order.totalCapturedAmount).to.equal(500);
			done();
		});
	});
}

module.exports = function(credentials) {
	return paySuite.bind(this, credentials);
};
