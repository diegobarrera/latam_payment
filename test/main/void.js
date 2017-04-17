var expect = require('chai').expect;
var uuid = require('node-uuid');
var amex = require('gateway/amex');
var latam_payment = require('index.js');

var orderId, transactionId;

function voidAmex(credentials) {
	afterEach(function afterEach(done) {
		amex.void(orderId, transactionId, credentials, function() {
			done();
		});
	});
	it('Void amex', function test(done) {
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
			payload = {
				transaction: {
					order_id: orderId,
					transaction_id: transactionId,
				},
				security: credentials,
			};
			latam_payment.void('amex', payload, function(err, result) {
				expect(err).to.not.exist;
				done();
			});
		});
	});
}

module.exports = function(credentials) {
	return function voidSuite() {
		voidAmex.bind(this)(credentials.amex);
	};
};
