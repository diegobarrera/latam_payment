var expect = require('chai').expect;
var latam_payment = require('index.js');
var amex = require('gateway/amex');

function tokenizeAmex(credentials) {
	it('Correct amex', function test(done) {
		var data = {
			metadata: {
				country: 'MEX',
			},
			card: {
				exp_month: '05',
				exp_year: '17',
				number: '345678000000007',
				securityCode: '0000',
			},
			security: credentials,
		};
		latam_payment.tokenize('amex', data, function(err, result) {
			expect(err).to.not.exist;
			expect(result.body).to.have.all.keys(['token', 'last4', 'cardType', 'maskedNumber', 'uniqueNumberIdentifier', 'customer', 'country', 'type', 'csv']);
			amex.deleteToken(result.body.token, credentials, function() {});
			done();
		});
	});
}

module.exports = function(credentials) {
	return function tokenizeSuite() {
		tokenizeAmex.bind(this)(credentials.amex);
	};
};
