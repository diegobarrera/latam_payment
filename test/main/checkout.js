var expect = require('chai').expect;
var uuid = require('node-uuid');
var amex = require('gateway/amex');
var latam_payment = require('index.js');

var orderId, transactionId;

function checkoutAmex(credentials) {
	afterEach(function afterEach(done) {
		amex.void(orderId, transactionId, credentials, function() {
			done();
		});
	});
	it('Checkout amex authorize', function test(done) {
		orderId = uuid.v1();
		var payload = {
			email: 'test@email.com',
			payment: {
				orderId: orderId,
				internal_reference: 'ABC12398',
				amount: 500,
				currency: 'MXN',
				source: {
					card: '345678156470007',
				},
				mode: 'authorize',
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
			security: credentials,
		};
		latam_payment.checkout('amex', payload, function(err, result) {
			expect(err).to.not.exist;
			expect(result.body).to.have.all.keys(['orderId', 'transaction', 'amount', 'currency', 'status']);
			expect(result.body.orderId).to.equal(orderId);
			expect(result.body.status).to.equal('authorized');
			expect(result.body.amount).to.equal(500);
			expect(result.body.currency).to.equal('MXN');
			transactionId = result.body.transaction;
			done();
		});
	});
	it('Checkout amex capture', function test(done) {
		orderId = uuid.v1();
		var payload = {
			email: 'test@email.com',
			payment: {
				orderId: orderId,
				internal_reference: 'ABC12398',
				amount: 500,
				currency: 'MXN',
				source: {
					card: '345678156470007',
				},
				mode: 'capture',
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
			security: credentials,
		};
		latam_payment.checkout('amex', payload, function(err, result) {
			expect(err).to.not.exist;
			expect(result.body).to.have.all.keys(['orderId', 'transaction', 'amount', 'currency', 'status']);
			expect(result.body.orderId).to.equal(orderId);
			expect(result.body.status).to.equal('captured');
			expect(result.body.amount).to.equal(500);
			expect(result.body.currency).to.equal('MXN');
			transactionId = result.body.transaction;
			done();
		});
	});
}

module.exports = function(credentials) {
	return function checkoutSuite() {
		checkoutAmex.bind(this)(credentials.amex);
	};
};
