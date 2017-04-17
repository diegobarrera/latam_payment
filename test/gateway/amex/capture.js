var expect = require('chai').expect;
var uuid = require('node-uuid');
var amex = require('gateway/amex');

var orderId, transactionId;

function captureSuite(credentials) {
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
			transactionId = body.transaction.id;
			done();
		});
	});
	afterEach(function afterEach(done) {
		amex.void(orderId, transactionId, credentials, function() {
			done();
		});
	});
	it('Capture authorized payment', function test(done) {
		var payload = {
			payment: {
				amount: 500,
				currency: 'MXN',
			},
		};
		amex.capture(orderId, payload, credentials, function(err, body) {
			expect(err).to.not.exist;
			expect(body.transaction.type).to.equal('CAPTURE');
			expect(body.order.status).to.equal('CAPTURED');
			done();
		});
	});
	it('Capture smaller amount', function test(done) {
		var payload = {
			payment: {
				amount: 300,
				currency: 'MXN',
			},
		};
		amex.capture(orderId, payload, credentials, function(err, body) {
			expect(err).to.not.exist;
			expect(body.order.status).to.equal('PARTIALLY_CAPTURED');
			done();
		});
	});
	it('Capture larger amount', function test(done) {
		var payload = {
			payment: {
				amount: 501,
				currency: 'MXN',
			},
		};
		amex.capture(orderId, payload, credentials, function(err, body) {
			expect(err).to.exist;
			expect(err.statusCode).to.equal(400);
			expect(err.explanation).to.contain('Requested capture amount exceeds outstanding authorized amount');
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
		amex.capture('jdklajg156156', payload, credentials, function(err, body) {
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
		amex.capture(null, payload, credentials, function(err, body) {
			expect(err).to.exist;
			expect(err.statusCode).to.equal(400);
			expect(err.explanation).to.contain('An order with this ID does not exist');
			done();
		});
	});
}

module.exports = function(credentials) {
	return captureSuite.bind(this, credentials);
};
