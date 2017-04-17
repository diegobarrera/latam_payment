var expect = require('chai').expect;
var amex = require('gateway/amex');

function createTokenSuite(credentials) {
	it('Create card token', function test(done) {
		var payload = {
			sourceOfFunds: {
				provided: {
					card: {
						expiry: {
							month: '05',
							year: '17',
						},
						number: '345678000000007',
						securityCode: '0000'
					},
				},
				type: 'CARD',
			},
		};
		amex.createToken(payload, credentials, function(err, body) {
			expect(err).to.not.exist;
			expect(body).to.have.any.keys(['token', 'sourceOfFunds']);
			expect(body.sourceOfFunds).to.have.any.keys(['provided']);
			expect(body.sourceOfFunds.provided).to.have.all.keys(['card']);
			expect(body.sourceOfFunds.provided.card).to.have.any.keys(['number', 'brand']);
			amex.deleteToken(body.token, credentials, function() {});
			done();
		});
	});
}

module.exports = function(credentials) {
	return createTokenSuite.bind(this, credentials);
};
