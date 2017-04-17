var expect = require('chai').expect;
var uuid = require('node-uuid');
var amex = require('gateway/amex');

var orderId, transactionId;

function authorizeSuite(credentials) {
	afterEach(function afterEach(done) {
		amex.void(orderId, transactionId, credentials, function() {
			done();
		});
	});
	it('Authorize payment', function test(done) {
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
			expect(err).to.not.exist;
			transactionId = body.transaction.id;
			done();
		});
	});
	it('Card declined', function test(done) {
		orderId = uuid.v1();
		var payload = {
			email: 'test@email.com',
			payment: {
				internal_reference: 'ABC12398',
				amount: 500,
				currency: 'MXN',
				source: {
					card: '345678964230007',
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
			expect(err).to.not.exist;
			expect(body.order.status).to.equal('FAILED');
			expect(body.response.gatewayCode).to.equal('DECLINED');
			transactionId = body.transaction.id;
			done();
		});
	});
	it('Card expired', function test(done) {
		orderId = uuid.v1();
		var payload = {
			email: 'test@email.com',
			payment: {
				internal_reference: 'ABC12398',
				amount: 500,
				currency: 'MXN',
				source: {
					card: '345678369920007',
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
			expect(err).to.not.exist;
			expect(body.order.status).to.equal('FAILED');
			expect(body.response.gatewayCode).to.equal('DECLINED');
			transactionId = body.transaction.id;
			done();
		});
	});
	it('Card unspecified failure', function test(done) {
		orderId = uuid.v1();
		var payload = {
			email: 'test@email.com',
			payment: {
				internal_reference: 'ABC12398',
				amount: 500,
				currency: 'MXN',
				source: {
					card: '345678409650007',
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
			expect(err).to.not.exist;
			expect(body.order.status).to.equal('FAILED');
			expect(body.response.gatewayCode).to.equal('DECLINED');
			transactionId = body.transaction.id;
			done();
		});
	});
}

module.exports = function(credentials) {
	return authorizeSuite.bind(this, credentials);
};
