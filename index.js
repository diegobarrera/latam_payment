'use strict';

var request = require('request');
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

LatamPayment.prototype.register = function(country, user_data, cb) {
	var self = this;
	try {
		country = country.toUpperCase();
		if (country === "COL") { // use PayU
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
			payU.tokenize(url, data, country, function(err, card_token) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
				}
				self.response.body.card = card_token;
				cb(err, self.response);
			});
		} else if (country === "MEX") { // use Stripe
			user_data.source = user_data.card;
			var security = user_data.security;
			if (user_data.user_token) {
				stripe.createPaymentMethod(user_data, function(err, card_token) {
					if (err) {
						self.response.success = false;
						throw ("User was not created. " + err);
					}
					self.response.body.card = card_token.id;
					self.response.body.fingerprint = card_token.fingerprint;
					cb(err, self.response);
				});
			} else {
				stripe.createUser(user_data, function(err, user_token) {
					if (err) {
						self.response.success = false;
						throw ("User was not created. " + err);
					}
					user_data.user_token = user_token;
					self.response.body.user = user_token;
					user_data.security = security;
					stripe.createPaymentMethod(user_data, function(err, card_token) {
						if (err) {
							self.response.success = false;
							throw ("User was not created. " + err);
						}
						self.response.body.card = card_token.id;
						self.response.body.fingerprint = card_token.fingerprint;
						cb(err, self.response);
					});
				});
			}
		} else if (country === "ARG") { // use PayU
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
			payU.tokenize(url, data, country, function(err, card_token) {
				if (err) {
					self.response.success = false;
					self.response.error = err;
				}
				self.response.body.card = card_token;
				cb(err, self.response);
			});
		} else {
			throw "Country is not supported.";
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err;
		cb(err, self.response);
	}
};

LatamPayment.prototype.checkout = function(country, user_data, cb) {
	var self = this;
	try {
		country = country.toUpperCase();
		if (country === "COL") { // use PayU
			var credentials = {
				apiLogin: user_data.security.api_login,
				apiKey: user_data.security.api_key
			};
			if (user_data.security && !user_data.security.url) {
				user_data.security.url = "https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi";
			}
			payU.sale(user_data, credentials, 'AUTHORIZATION_AND_CAPTURE', function(err, body) {
				if (err) {
					self.response.success = false;
					self.response.error = err;
				}
				self.response.body.transaction = body;
				return cb(err, self.response);
			});
		} else if (country === "MEX") { // use Stripe
			var data = {
				amount: user_data.payment.amount,
				internal_reference: user_data.payment.internal_reference,
				source: {
					user: user_data.payment.source.user,
					email: user_data.email,
					card: user_data.payment.source.card
				},
				security: {
					api_key: user_data.security.api_key
				}
			};
			stripe.sale(data, function(err, charge) {
				if (err || charge.status !== 'succeeded') {
					self.response.success = false;
					self.response.error = err;
				}
				self.response.body.transaction = charge.id;
				return cb(err, self.response);
			});
		} else if (country === "ARG") { // use PayU
			var credentials = {
				apiLogin: user_data.security.api_login,
				apiKey: user_data.security.api_key
			};
			if (user_data.security && !user_data.security.url) {
				user_data.security.url = "https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi";
			}
			payU.sale(user_data, credentials, 'AUTHORIZATION', function(err, body) {
				if (err) {
					self.response.error = err;
					self.response.success = false;
				}
				self.response.body.transaction = body;
				return cb(err, self.response);
			});
		} else {
			throw "Country is not supported.";
		}
	} catch (err) {
		self.response.success = false;
		self.response.error = err;
		return cb(true, self.response);
	}
};


module.exports = new LatamPayment();
