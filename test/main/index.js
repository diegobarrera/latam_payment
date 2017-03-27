var credentials = {
	amex: {
		merchantId: 'TEST9353874515',
		password: 'd0f2cd569d431efcf62f5409cea56fd7',
	},
};

module.exports.registerSuite = require('./register')(credentials);
module.exports.tokenizeSuite = require('./tokenize')(credentials);
module.exports.checkoutSuite = require('./checkout')(credentials);
