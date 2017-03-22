var expect = require('chai').expect;
var amex = require('gateway/amex');

var credentials = {
	merchantId: 'TEST9353874515',
	password: 'd0f2cd569d431efcf62f5409cea56fd7',
};

var token = '345678156470007';
module.exports = function getTokenSuite() {
	it('Get card token', function test(done) {
		amex.getToken(token, credentials, function(err, body) {
			expect(err).to.not.exist;
			expect(body).to.have.any.keys(['token', 'sourceOfFunds']);
			expect(body.sourceOfFunds).to.have.any.keys(['provided']);
			expect(body.sourceOfFunds.provided).to.have.all.keys(['card']);
			expect(body.sourceOfFunds.provided.card).to.have.any.keys(['number', 'brand']);
			done();
		});
	});
	it('Token not found', function test(done) {
		amex.getToken('156156561516', credentials, function(err, body) {
			expect(err).to.exist;
			expect(err.statusCode).to.equal(400);
			expect(err.explanation).to.equal('Token not found');
			done();
		});
	});
};
