var expect = require('chai').expect;
var amex = require('gateway/amex');

var credentials = {
	merchantId: 'TEST9353874515',
	password: 'd0f2cd569d431efcf62f5409cea56fd7',
};

var token;
module.exports = function deleteTokenSuite() {
	beforeEach(function beforEach(done) {
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
			token = body.token;
			done();
		});
	});
	afterEach(function afterEach(done) {
		amex.deleteToken(token, credentials, function() {
			done();
		});
	});
	it('Delete card token', function test(done) {
		amex.deleteToken(token, credentials, function(err, body) {
			expect(err).to.not.exist;
			done();
		});
	});
	it('Token not found', function test(done) {
		amex.deleteToken('156156561516', credentials, function(err, body) {
			expect(err).to.exist;
			expect(err.statusCode).to.equal(400);
			expect(err.explanation).to.equal('Token not found');
			done();
		});
	});
};
