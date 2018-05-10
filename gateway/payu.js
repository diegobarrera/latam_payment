'use strict';

var request = require('request');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment-timezone');
var _ = require('lodash');

var get_gateway = function(country) {
	var gateway = {};
	return gateway;
};


var cities_dictionary = function(cityCode) {
	switch (cityCode) {
		case "BOG":
			return "Bogota";
		case "MED":
			return "Medellin";
		case "CIA":
			return "Chia";
		case "BNA":
			return "Buenos Aires";
		default:
			return cityCode;
	}
};

var defineCountry = function(countryCode) {
    switch (countryCode) {
        case 'COL':
            return {
                code: 'CO',
                currency: 'COP'
            };
            break;
        case 'ARG':
            return {
                code: 'AR',
                currency: 'ARS'
            };
            break;
        case 'MEX':
            return {
                code: 'MX',
                currency: 'MXN'
            };
            break;
        default:
            return {
                code: 'CO',
                currency: 'COP'
            };
    }
}

var calculateMD5Hash = function(data, cb) {
	var response = crypto.createHash('md5').update(data).digest("hex");
	cb(response);
};

module.exports.inverse_tokenization = function(url, payload, credentials, cb) {
	var data = {
		"language": "es",
		"command": "GET_TOKENS",
		"merchant": credentials,
		"creditCardTokenInformation": payload
	};
	request({
		url: url,
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		json: true,
		body: data
	}, function(err, res, body) {
		if (body && body.code === 'SUCCESS') {
			cb(err, body.creditCardTokenList[0]);
		} else {
			err = err + " " + body.error;
			cb(err, null);
		}
	});
};

module.exports.tokenize = function(url, data, country, cb) {
	data.creditCardToken.name = unescape(encodeURIComponent(data.creditCardToken.name));
	request({
		url: url,
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		json: true,
		body: data
	}, function(err, res, body) {
		if (body && body.code === 'SUCCESS') {
			cb(err, body.creditCardToken.creditCardTokenId);
		} else {
			err = err + " " + body.error;
			cb(err, null);
		}
	});
};

module.exports.getPaymentMethods = function(cb) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
	request({
		url: config.payu.urlpaymentsApi,
		method: 'POST',
		json: true,
		body: {
			test: config.payu.test,
			language: 'es',
			command: 'GET_PAYMENT_METHODS',
			merchant: gateway,
		}
	}, function(error, response, body) {
		cb(error);
	});
};

module.exports.createToken = function(user_id, name, id_Number, paymentMethod, card_number, exp_date, cb) {
	//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	request({
		url: config.payu.urlpaymentsApi,
		method: 'POST',
		json: true,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: {
			test: config.payu.test,
			language: 'es',
			command: 'CREATE_TOKEN',
			merchant: gateway,
			creditCardToken: {
				payerId: user_id,
				name: name,
				identificationNumber: id_Number,
				paymentMethod: paymentMethod,
				number: card_number,
				expirationDate: exp_date
			}
		}
	}, function(error, response, body) {
		cb(error, body);
	});
};


module.exports.delete_payment_method = function(url, payload, credentials, cb) {
	credentials.apiLogin = credentials.apiLogin || credentials.api_login;
	credentials.apiKey = credentials.apiKey || credentials.api_key;
	delete credentials.api_key;
	delete credentials.api_login;
	request({
		url: url,
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		json: true,
		body: {
			language: 'es',
			command: 'REMOVE_TOKEN',
			merchant: credentials,
			removeCreditCardToken: {
				payerId: payload.user,
				creditCardTokenId: payload.card,
			},
		},
	}, function(error, response, body) {
		if (body && body.code === 'SUCCESS') {
			cb(null, body);
		} else {
			error = error || new Error('');
			if (body && body.error) {
				error.message = error.message+ " " + body.error;
			}
			cb(error, null);
		}
	});
};

module.exports.sale = function(payload, credentials, type, cb) {
	var country = defineCountry(payload.metadata.country).code;
	var refCode = payload.payment.internal_reference + moment(new Date()).format();
	var description = 'payment';
	var currency = defineCountry(payload.metadata.country).currency;
	var accountId = payload.security.account_id;
	var microtime = payload.security.device_session_id + '~' + moment(new Date()).format();
	var amount = Number(Number(payload.payment.amount).toFixed(2));

	async.parallel([function signature2(cb) {
		calculateMD5Hash(microtime, function(signature2) {
			cb(null, signature2);
		});
	}, function signature(cb) {
		var hashable = payload.security.api_key + '~' + payload.security.merchant_id + '~' + refCode + '~' + amount + '~' + currency;
		calculateMD5Hash(hashable, function(signature) {
			cb(null, signature);
		});
	}], function(err, results) {
		var signature2 = results[0];
		var signature = results[1];
		var body = {
			language: 'es',
			command: 'SUBMIT_TRANSACTION',
			merchant: credentials,
			transaction: {
				order: {
					accountId: accountId,
					referenceCode: refCode,
					description: description,
					language: 'es',
					signature: signature,
					additionalValues: {
						TX_VALUE: {
							value: amount,
							currency: currency
						}
					},
					buyer: {
						fullName: payload.metadata.first_name + ' ' + payload.metadata.last_name,
						emailAddress: payload.email,
						shippingAddress: {
							city: cities_dictionary(payload.address.city),
							street1: payload.address.line1,
							phone: payload.metadata.phone
						},
						dniNumber: ''
					}
				},
				payer: {
					fullName: payload.metadata.first_name + ' ' + payload.metadata.last_name,
					emailAddress: payload.email,
					contactPhone: payload.metadata.phone,
					billingAddress: {
						city: cities_dictionary(payload.address.city),
						street1: payload.address.line1,
						phone: payload.metadata.phone
					},
					dniNumber: ''
				},
				creditCardTokenId: payload.payment.source.card,
				extraParameters: {
					'INSTALLMENTS_NUMBER': 1
				},
				type: type,
				paymentMethod: payload.payment.card_type,
				paymentCountry: country,
				deviceSessionId: payload.security.device_session_id || signature2,
				ipAddress: payload.security.ip,
				cookie: payload.security.device_session_id,
				userAgent: payload.security.user_agent,
			},
		};
		if (country === 'MX') {
			body.payer.birthdate = payload.metadata.birthdate || '1990-05-25';
		}
		if (payload.payment.cvc) {
			body.transaction.creditCard = {
				securityCode: payload.payment.cvc
			};
		}
		request({
			url: payload.security.url,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: body
		}, function(error, response, body) {
			if (body && body.transactionResponse && body.transactionResponse.state === 'APPROVED') {
				body.transactionResponse.captured = (type === "AUTHORIZATION_AND_CAPTURE");
				return cb(error, body.transactionResponse);
			}
			error = error || new Error('');
			if (body && body.error) {
				error.message = error.message + " " + body.error;
			}
			if (body && body.transactionResponse) {
				error.message = error.message + " " + body.transactionResponse.responseCode;
			}
			error.message = error.message.trim();
			cb(error);
		});
	});
};

module.exports.void = function(payload, credentials, cb) {
	var url = payload.security.url;
	var country = defineCountry(payload.metadata.country).code;
	request({
		url: url,
		method: 'POST',
		json: true,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: {
			'language': 'es',
			'command': 'SUBMIT_TRANSACTION',
			'merchant': credentials,
			'transaction': {
				'order': {
					'id': payload.transaction.order_id
				},
				'type': 'VOID',
				'reason': 'Return for verification',
				'parentTransactionId': payload.transaction.transaction_id
			},
			'test': false
		}
	}, function(err, response, body) {
		if (body && body.code === 'SUCCESS') {
			cb(err, body);
		} else {
			err = err + " " + body.error;
			cb(err, null);
		}
	});
};

module.exports.partialRefund = function(token, order_id, amount, cb) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	request({
		url: config.payu.urlpaymentsApi, // "https://stg.api.payulatam.com/payments-api/4.0/service.cgi",
		method: 'POST',
		json: true,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: {
			'language': 'es',
			'command': 'SUBMIT_TRANSACTION',
			'merchant': gateway,
			'transaction': {
				'order': {
					'id': order_id
				},
				'type': 'PARTIAL_REFUND', // arg 'type': 'PARTIAL_REFUND '
				'reason': 'Client reject products',
				'parentTransactionId': token
			},
			'test': config.payu.test
		}
	}, function(error, response, body) {
		cb(error, body);
	});
};


module.exports.refundRequest = function(token, order_id, amount, cb) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	request({
		url: config.payu.urlpaymentsApi,
		method: 'POST',
		json: true,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: {
			'language': 'es',
			'command': 'SUBMIT_TRANSACTION',
			'merchant': gateway,
			'transaction': {
				'order': {
					'id': order_id
				},
				'type': 'VOID', // col 'type': 'REFUND '
				'reason': 'Client reject products',
				'parentTransactionId': token
			},
			'test': config.payu.test
		}

	}, function(error, response, body) {
		cb(error, body);
	});

};

module.exports.paymentRequest = function(transaction, order_id, location, cb) {
	request({
		url: config.payu.urlqueries, //"https://sandbox.api.payulatam.com/reports-api/4.0/service.cgi",
		method: 'POST',
		json: true,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: {
			'test': config.payu.test,
			'language': 'es',
			'command': 'TRANSACTION_RESPONSE_DETAIL',
			'merchant': gateway,
			'details': {
				'transactionId': transaction.transactionResponse.transactionId
			}
		}
	}, function(error, response, body) {
		cb(null, body.result.payload.state);
	});
};

module.exports.authorization = function(partial_order, user_id, token, order_number, addresses, amount, cb) {
	var country = (payload.metadata.country === 'COL') ? 'CO' : 'AR';
	var refCode = payload.payment.internal_reference + moment(new Date()).format();
	var description = 'payment';
	var currency = payload.metadata.country === 'COL' ? 'COP' : 'ARS';
	var accountId = payload.security.account_id;
	var microtime = payload.security.device_session_id + '~' + moment(new Date()).format();
	var amount = Number(Number(payload.payment.amount).toFixed(2));

	async.parallel([function signature2(cb) {
		calculateMD5Hash(microtime, function(signature2) {
			cb(null, signature2);
		});
	}, function signature(cb) {
		var hashable = payload.security.api_key + '~' + payload.security.merchant_id + '~' + refCode + '~' + amount + '~' + currency;
		calculateMD5Hash(hashable, function(signature) {
			cb(null, signature);
		});
	}], function(err, results) {
		var signature2 = results[0];
		var signature = results[1];
		request({
			url: payload.security.url,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: {
				language: 'es',
				command: 'SUBMIT_TRANSACTION',
				merchant: credentials,
				transaction: {
					order: {
						accountId: accountId,
						referenceCode: refCode,
						description: description,
						language: 'es',
						signature: signature,
						additionalValues: {
							TX_VALUE: {
								value: amount,
								currency: currency
							}
						},
						buyer: {
							fullName: payload.metadata.first_name + ' ' + payload.metadata.last_name,
							emailAddress: payload.email,
							shippingAddress: {
								city: cities_dictionary(payload.address.city),
								street1: payload.address.line1,
								phone: payload.metadata.phone
							},
							dniNumber: ''
						}
					},
					payer: {
						fullName: payload.metadata.first_name + ' ' + payload.metadata.last_name,
						emailAddress: payload.email,
						contactPhone: payload.metadata.phone,
						billingAddress: {
							city: cities_dictionary(payload.address.city),
							street1: payload.address.line1,
							phone: payload.metadata.phone
						},
						dniNumber: ''
					},
					creditCardTokenId: payload.payment.source.card,
					extraParameters: {
						'INSTALLMENTS_NUMBER': 1
					},
					creditCard: {
						securityCode: payload.payment.cvc
					},
					type: 'AUTHORIZATION_AND_CAPTURE',
					paymentMethod: payload.payment.card_type,
					paymentCountry: country,
					deviceSessionId: payload.security.device_session_id || signature2,
					ipAddress: payload.security.ip,
					cookie: payload.security.device_session_id,
					userAgent: payload.security.user_agent,
				},
				test: payload.security.test_mode
			}
		}, function(error, response, body) {
			if (body.error) {
				if (body.transactionResponse && body.transactionResponse.state === 'DECLINED') {
					error = error + " " + body.transactionResponse.responseCode;
					cb(error, body);
				} else {
					cb(body.error, null);
				}
			} else {
				cb(error, body.transactionResponse.transactionId);
			}
		});

	});

};


var capture = function(order, cb) {
	var country = order.address.country.code;
	request({
			url: config.payu[country].urlpaymentsApi,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: {
				language: 'es',
				command: 'SUBMIT_TRANSACTION',
				merchant: get_gateway(country),
				transaction: {
					order: {
						id: order.payuOrder_Id
					},
					type: 'CAPTURE',
					parentTransactionId: order.transaction_id
				},
				test: config.payu[country].test
			}
		},
		function(error, response, body) {
			if (body && body.error) {
				if (body.transactionResponse && body.transactionResponse.state === 'DECLINED') {
					cb(error, body);
				} else {
					cb(body.error, body);
				}
			} else {
				cb(error, body);
			}
		});
};

module.exports.submit_for_settlement = function(order_id, amount, cb) {
	base.Order.find({
		_id: order_id
	}).populate([{
		path: 'user',
		select: 'email payment_info'
	}]).exec(function(err, order) {
		order = order[0];
		capture(order, function(err, transaction) {
			if (transaction && transaction.transactionResponse) {
				order.transaction_id = transaction.transactionResponse.transactionId;
				order.payuOrder_Id = transaction.transactionResponse.orderId;
				order.save(function(err, order) {});
				cb(err, transaction);
			} else {
				cb(err);
			}
		});
	});
};

module.exports.submit_for_settlement_by_location = function(partial_order, cb) {
	var country = partial_order.address.country.code;;
	request({
			url: config.payu[country].urlpaymentsApi,
			method: 'POST',
			json: true,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: {
				language: 'es',
				command: 'SUBMIT_TRANSACTION',
				merchant: get_gateway(country),
				transaction: {
					order: {
						id: partial_order.retailer_products[0].payuOrder_Id
					},
					type: 'CAPTURE',
					parentTransactionId: partial_order.retailer_products[0].transaction_id
				},
				test: config.payu[country].test
			}
		},
		function(error, response, body) {
			if (body && body.error) {
				if (body.transactionResponse && body.transactionResponse.state === 'DECLINED') {
					cb(error, body);
				} else {
					cb(body.error, body);
				}
			} else {
				cb(error, body);
			}
		});
};
