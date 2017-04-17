var expect = require('chai').expect;
var latam_payment = require('index.js');

function registerAmex(credentials) {
	var token = '345678156470007';
	it('Correct amex', function test(done) {
		var data = {
			email: 'some_email@test.com',
			metadata: {
				id: 'user id 1',
				first_name: 'John',
				last_name: 'Doe',
				country: 'MEX',
				city: 'MEX'
			},
			description: `Customer for some_email@test.com`,
			card: token,
			security: credentials,
		};
		latam_payment.register('amex', data, function(err, result) {
			expect(err).to.not.exist;
			expect(result.body).to.have.all.keys(['token', 'last4', 'cardType', 'maskedNumber', 'uniqueNumberIdentifier', 'customer', 'country', 'type', 'csv']);
			done();
		});
	});
	it('Token not found amex', function test(done) {
		var data = {
			email: 'some_email@test.com',
			metadata: {
				id: 'user id 1',
				first_name: 'John',
				last_name: 'Doe',
				country: 'MEX',
				city: 'MEX'
			},
			description: `Customer for some_email@test.com`,
			card: '35491561561',
			security: credentials,
		};
		latam_payment.register('amex', data, function(err, result) {
			expect(err).to.exist;
			expect(result.error).to.equal('Token not found');
			done();
		});
	});
}

module.exports = function(credentials) {
	return function registerSuite() {
		registerAmex.bind(this)(credentials.amex);
	};
};
