var expect = require('chai').expect;
var amex = require('gateway/amex');

module.exports = function getGatewayInfoSuite() {
	it('Gateway info', function test(done) {
		amex.getGatewayInfo(function(err, body) {
			expect(err).to.not.exist;
			expect(body).to.have.all.keys(['gatewayVersion', 'status']);
			done();
		});
	});
};
