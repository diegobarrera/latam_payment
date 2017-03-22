var expect = require('chai').expect;
var uuid = require('node-uuid');
var amex = require('gateway/amex');

var credentials = {
	merchantId: 'TEST9353874515',
	password: 'd0f2cd569d431efcf62f5409cea56fd7',
};

var orderId;
module.exports = function refundSuite() {
	beforeEach(function beforeEach(done) {
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
		amex.authorize(orderId, payload, credentials, function(err, body) {
			payload = {
				payment: {
					amount: 500,
					currency: 'MXN',
				},
			};
			amex.capture(orderId, payload, credentials, function(err, body) {
				transactionId = body.transaction.id;
				done();
			})
		});
	});
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
	it('Refund payment', function test(done) {
		var payload = {
			payment: {
				amount: 500,
				currency: 'MXN',
			},
		};
		amex.refund(orderId, payload, credentials, function(err, body) {
			expect(err).to.not.exist;
			expect(body.order.status).to.equal('REFUNDED');
			expect(body.order.totalRefundedAmount).to.equal(500);
			done();
		});
	});
	it('Refund payment with larger amount', function test(done) {
		var payload = {
			payment: {
				amount: 501,
				currency: 'MXN',
			},
		};
		amex.refund(orderId, payload, credentials, function(err, body) {
			expect(err).to.exist;
			expect(err.statusCode).to.equal(400);
			expect(err.explanation).to.contain('With this refund, the total refunded amount for the order exceeds the total captured amount for the order by more than the maximum amount you have configured in Merchant Administration');
			done();
		});
	});
	it('Refund payment with smaller amount', function test(done) {
		var payload = {
			payment: {
				amount: 300,
				currency: 'MXN',
			},
		};
		amex.refund(orderId, payload, credentials, function(err, body) {
			expect(err).to.not.exist;
			expect(body.order.status).to.equal('PARTIALLY_REFUNDED');
			expect(body.order.totalRefundedAmount).to.equal(300);
			done();
		});
	});
	it('orderId not found', function test(done) {
		var payload = {
			payment: {
				amount: 500,
				currency: 'MXN',
			},
		};
		amex.refund('jdklajg156156', payload, credentials, function(err, body) {
			expect(err).to.exist;
			expect(err.statusCode).to.equal(400);
			expect(err.explanation).to.contain('An order with this ID does not exist');
			done();
		});
	});
	it('Null orderId', function test(done) {
		var payload = {
			payment: {
				amount: 500,
				currency: 'MXN',
			},
		};
		amex.refund(null, payload, credentials, function(err, body) {
			expect(err).to.exist;
			expect(err.statusCode).to.equal(400);
			expect(err.explanation).to.contain('An order with this ID does not exist');
			done();
		});
	});
};
