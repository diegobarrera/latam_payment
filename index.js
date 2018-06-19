'use strict';

var amex = require('./gateway/amex.js');
var payU = require('./gateway/payu.js');
var stripe = require('./gateway/stripe.js');

function LatamPayment() {
	this.response = {
		success: true,
		error: null,
		body: {}
	};
	return this;
}

//Only available for AMEX
LatamPayment.prototype.registerCreditCard = function (type, user_data, credentials, cb) {
	var self = this;
	try {
		if (type === 'amex') {
			var getAmexResponse = function (body) {
				return {
					token: body.token,
					last4: body.sourceOfFunds.provided.card.number.slice(-4),
					cardType: body.sourceOfFunds.provided.card.brand,
					maskedNumber: body.sourceOfFunds.provided.card.number,
					uniqueNumberIdentifier: body.token,
					customer: null,
					country: null,
					type: type,
					csv: null,
				};
			};
			amex.createToken(user_data, credentials, function (err, card_token) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
					self.response.body = {};
				} else {
					self.response.error = null;
					self.response.success = true;
					self.response.body = getAmexResponse(card_token);
				}
				cb(err, self.response);
			});
		} else {
			throw new Error("Type is not supported");
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err.message;
		self.response.body = {};
		cb(err, self.response);
	}
};


LatamPayment.prototype.register = function (type, user_data, cb) {
	var self = this;
	try {
		if (type === "payu") { // use PayU
			var credentials = {
				apiLogin: user_data.security.api_login,
				apiKey: user_data.security.api_key
			};
			var payload = {
				"creditCardTokenId": user_data.card
			};
			var url = user_data.security.url;
			payU.inverse_tokenization(url, payload, credentials, function (err, card_info) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
					self.response.body = {};
				} else {
					self.response.error = false;
					self.response.success = true;
					self.response.body = {
						token: card_info.creditCardTokenId,
						last4: card_info.maskedNumber.slice(-4),
						cardType: card_info.paymentMethod.toUpperCase(),
						maskedNumber: card_info.maskedNumber,
						uniqueNumberIdentifier: card_info.identificationNumber,
						customer: null,
						country: user_data.metadata.country,
						type: type,
						csv: user_data.csv,
					};
				}
				cb(err, self.response);
			});
		} else if (type === "stripe") { // use Stripe
			var getStripeResponse = function (card_token) {
				return {
					token: card_token.id,
					last4: card_token.last4,
					cardType: card_token.brand.toUpperCase(),
					maskedNumber: '****' + card_token.last4,
					uniqueNumberIdentifier: card_token.fingerprint,
					customer: card_token.customer,
					country: user_data.metadata.country,
					type: type,
					csv: null,
				};
			};
			user_data.source = user_data.card;
			var security = user_data.security;
			if (user_data.user_token) {
				stripe.addPaymentMethod(user_data, function (err, card_token) {
					if (err) {
						self.response.success = false;
						self.response.error = err.message;
						self.response.body = {};
					} else {
						self.response.error = false;
						self.response.success = true;
						self.response.body = getStripeResponse(card_token);
					}
					cb(err, self.response);
				});
			} else {
				stripe.createUser(user_data, function (err, user_token) {
					if (err) {
						self.response.success = false;
						self.response.error = err.message;
						self.response.body = {};
						return cb(err, self.response);
					}
					user_data.user_token = user_token;
					self.response.body.user = user_token;
					user_data.security = security;
					stripe.addPaymentMethod(user_data, function (err, card_token) {
						if (err) {
							self.response.success = false;
							self.response.error = err.message;
							self.response.body = {};
						} else {
							self.response.error = false;
							self.response.success = true;
							self.response.body = getStripeResponse(card_token);
						}
						cb(err, self.response);
					});
				});
			}
		} else if (type === "amex") {
			var getAmexResponse = function (body) {
				return {
					token: body.token,
					last4: body.sourceOfFunds.provided.card.number.slice(-4),
					cardType: body.sourceOfFunds.provided.card.brand,
					maskedNumber: body.sourceOfFunds.provided.card.number,
					uniqueNumberIdentifier: body.token,
					customer: null,
					country: user_data.metadata.country,
					type: type,
					csv: null,
				};
			};
			var credentials = user_data.security;
			var tokenId = user_data.card;
			amex.getToken(tokenId, credentials, function (err, body) {
				if (err) {
					self.response.success = false;
					self.response.error = err.explanation;
					self.response.body = {};
				} else {
					self.response.error = false;
					self.response.success = true;
					self.response.body = getAmexResponse(body);
				}
				cb(err, self.response);
			});
		} else {
			throw new Error("Type is not supported");
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err.message;
		self.response.body = {};
		cb(err, self.response);
	}
};

LatamPayment.prototype.checkout = function (type, user_data, cb) {
	var self = this;
	try {
		var amount = Number(Number(user_data.payment.amount).toFixed(2));
		if (type === "payu") { // use PayU
			var credentials = {
				apiLogin: user_data.security.api_login,
				apiKey: user_data.security.api_key
			};
			var payment_mode = user_data.payment.mode || 'AUTHORIZATION_AND_CAPTURE';
			if (user_data.security && !user_data.security.url) {
				user_data.security.url = "https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi";
			}
			payU.sale(user_data, credentials, payment_mode, function (err, body) {
				if (err) {
					self.response.success = false;
					self.response.error = err.message;
					self.response.body = {};
				} else {
					self.response.success = true;
					self.response.error = false;
					self.response.body = {
						orderId: body.orderId,
						transaction: body.transactionId,
						status: body.captured ? "paid" : "authorized",
						amount: amount,
					};
				}
				cb(err, self.response);
			});
		} else if (type === "stripe") { // use Stripe
			var data = {
				amount: user_data.payment.amount,
				internal_reference: user_data.payment.internal_reference,
				source: {
					user: user_data.payment.source.user,
					email: user_data.email,
					card: user_data.payment.source.card
				},
				mode: user_data.payment.mode,
				security: {
					api_key: user_data.security.api_key
				}
			};
			stripe.sale(data, function (err, body) {
				if (err || body.status !== 'succeeded') {
					self.response.success = false;
					self.response.error = err.message;
					self.response.body = {};
				} else {
					self.response.success = true;
					self.response.error = false;
					self.response.body = {
						orderId: null,
						transaction: body.id,
						status: body.captured ? "paid" : "authorized",
						amount: amount,
					};
				}
				cb(err, self.response);
			});
		} else if (type === "amex") { // use Amex
			var getAmexResponse = function (body) {
				var status;
				if (body.order.status === 'CAPTURED') {
					status = 'paid';
				} else if (body.order.status === 'AUTHORIZED') {
					status = 'authorized';
				} else {
					status = body.order.status.toLowerCase();
				}
				return {
					orderId: body.order.id,
					transaction: body.transaction.id,
					status: status,
					amount: body.transaction.amount,
					currency: body.transaction.currency,
				};
			};
			var paymentMode = user_data.payment.mode;
			var action = amex.validateMode(paymentMode) ? paymentMode : 'authorize';
			var orderId = user_data.payment.orderId;
			var payload = {
				email: user_data.email,
				payment: {
					internal_reference: user_data.payment.internal_reference,
					amount: user_data.payment.amount,
					currency: user_data.payment.currency,
					source: {
						card: user_data.payment.source.card,
					},
				},
				metadata: user_data.metadata,
				address: user_data.address,
			};
			var credentials = user_data.security;
			amex[action](orderId, payload, credentials, function (err, body) {
				if (err) {
					self.response.success = false;
					self.response.error = err.explanation;
					self.response.body = {};
				} else {
					self.response.error = false;
					self.response.success = true;
					self.response.body = getAmexResponse(body);
				}
				cb(err, self.response);
			});
		} else {
			throw "Type is not supported.";
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err.message;
		self.response.body = {};
		cb(err, self.response);
	}
};

LatamPayment.prototype.remove = function (type, user_data, cb) {
	var self = this;
	try {
		var credentials = user_data.security;
		var payload = user_data.source;
		if (type === "payu") {
			payU.delete_payment_method(user_data.url, payload, credentials, function (err, body) {
				if (err) {
					self.response.success = false;
					self.response.error = err.message;
					self.response.body = {};
				} else {
					self.response.success = true;
					self.response.error = false;
					self.response.body = {
						token: body.creditCardToken.creditCardTokenId,
					};
				}
				cb(err, self.response);
			})
		} else if (type === "stripe") {
			stripe.delete_payment_method(payload, credentials, function (err, body) {
				if (err || !body.deleted) {
					self.response.success = false;
					self.response.error = err ? err.message : "Card not deleted";
					self.response.body = {};
				} else {
					self.response.success = true;
					self.response.error = false;
					self.response.body = {
						token: body.id,
					};
				}
				cb(err, self.response);
			});
		} else {
			throw new Error("Type is not supported.");
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err.message;
		self.response.body = {};
		cb(err, self.response);
	}
};

LatamPayment.prototype.tokenize = function (type, user_data, cb) {
	var self = this;
	try {
		if (type === "payu") { // use PayU
			var url = user_data.security.url;
			var data = {
				language: "es",
				command: "CREATE_TOKEN",
				merchant: {
					apiLogin: user_data.security.api_login,
					apiKey: user_data.security.api_key
				},
				creditCardToken: {
					payerId: user_data.metadata.unique_id,
					name: user_data.metadata.first_name + " " + user_data.metadata.last_name,
					paymentMethod: user_data.card.card_type,
					number: user_data.card.number,
					expirationDate: user_data.card.exp_year + "/" + user_data.card.exp_month
				}
			};
			var country = user_data.country || 'COL';
			payU.tokenize(url, data, country, function (err, card_token) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
				}
				self.response.body.card = card_token;
				cb(err, self.response);
			});
		} else if (type === 'amex') {
			var getAmexResponse = function (body) {
				return {
					token: body.token,
					last4: body.sourceOfFunds.provided.card.number.slice(-4),
					cardType: body.sourceOfFunds.provided.card.brand,
					maskedNumber: body.sourceOfFunds.provided.card.number,
					uniqueNumberIdentifier: body.token,
					customer: null,
					country: user_data.metadata.country,
					type: type,
					csv: null,
				};
			};
			var credentials = user_data.security;
			var payload = {
				sourceOfFunds: {
					provided: {
						card: {
							expiry: {
								month: user_data.card.exp_month,
								year: user_data.card.exp_year,
							},
							number: user_data.card.number,
							securityCode: user_data.card.securityCode,
						},
					},
					type: 'CARD',
				},
				transaction: {
					currency: user_data.card.currency || 'USD',
				},
			};
			amex.createToken(payload, credentials, function (err, card_token) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
					self.response.body = {};
				} else {
					self.response.error = null;
					self.response.success = true;
					self.response.body = getAmexResponse(card_token);
				}
				cb(err, self.response);
			});
		} else {
			throw "Type is not supported.";
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err;
		cb(err, self.response);
	}
};

LatamPayment.prototype.void = function (type, user_data, cb) {
	var self = this;
	try {
		if (type === "payu") { // use PayU
			var credentials = {
				apiLogin: user_data.security.api_login,
				apiKey: user_data.security.api_key
			};
			var country = user_data.country || 'COL';
			payU.void(user_data, credentials, function (err, transaction) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
				}
				self.response.body = {
					//transaction: transaction
				};
				cb(err, self.response);
			});
		} else if (type === "amex") {
			var credentials = user_data.security;
			var orderId = user_data.transaction.order_id;
			var targetTransactionId = user_data.transaction.transaction_id;
			amex.void(orderId, targetTransactionId, credentials, function (err, result) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
					self.response.body = {};
				} else {
					self.response.error = null;
					self.response.success = true;
					self.response.body = {};
				}
				cb(err, self.response);
			});
		} else {
			throw "Type is not supported.";
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err;
		cb(err, self.response);
	}
};




module.exports = new LatamPayment();