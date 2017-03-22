var expect = require('chai').expect;
var amex = require('gateway/amex');

var credentials = {
	merchantId: 'TEST9353874515',
	password: 'd0f2cd569d431efcf62f5409cea56fd7',
};

module.exports = function createTokenSuite() {
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
};
