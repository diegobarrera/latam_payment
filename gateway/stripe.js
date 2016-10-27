/************************************************************ 
/* Wrapper around Stripe module for Mercadoni's integration *
/* Author: Juan Sebastian Vizcaino Castro                   *
/* 2015-05-01                                               *
/* elvizcacho@gmail.com                                     *
/* version: 1.0                                             *
/************************************************************/
'use strict';

var async = require('async');
var stripe = require("stripe"); //("sk_test_xY75KXHIxDMsEgbNeKVtosKC");
var stripe1 = null;

var cardNumberFormat = function(card) {
	var set_1 = card.slice(0, 6);
	var set_3 = card.slice(11, card.length);
	return set_1 + '******' + set_3;
};

/**
 * get Mercadoni's info account by country
 * @param  {[type]}   country country of the account
 * @param  {Function} cb      callback that returns and err and account
 */
var getAccountByCountry = function(country, cb) {
	if (config.stripe.account[country])
		return stripe.accounts.retrieve(config.stripe.account[country].id, cb);
	cb({
		msg: 'This country is not supported by Mercadoni',
		codes: ['M900']
	});
};

/**
 * Creates a Stripe customer and storages its Id in User model.
 * @param  {String}   	source 	source which is provided by Stripe.js from the client
 * @param  {ObjectId}   user_id user id
 * @param  {Function} 	cb      callback with err and customer object from Stripe
 */
var createUser = function(payload, cb) {
	if (!stripe1) stripe1 = stripe(payload.security.api_key);
	delete payload.security;
	payload = {
		email: payload.email,
		metadata: {
			first_name: payload.first_name,
			last_name: payload.last_name,
			country: payload.country,
			city: payload.city
		},
		description: payload.description
	};
	async.waterfall([

		function(cb) { // creates customer on Stripe
			stripe1.customers.create(payload, function(err, stripe_customer) {
				cb(err, stripe_customer);
			});
		},
		function(stripe_customer, cb) { // saves token in user
			if (!stripe_customer.codes) {
				cb(null, stripe_customer.id);
			} else {
				cb(null, null);
			}
		}
	], cb);
};

/**
 * Adds new payment method to user
 * @param  {String}   source       	source which is provided by Stripe.js from the client
 * @param  {ObjectId} user_id    	  user id
 * @param  {String}   maskedNumber 	masked number
 * @param  {Function} cb           	callback that returns an error and user object
 */
var createPaymentMethod = function(payload, cb) {
	if (!stripe1) stripe1 = stripe(payload.security.api_key);
	var data = {
		source: {
			object: "card",
			exp_month: payload.card.exp_month,
			exp_year: payload.card.exp_year,
			number: payload.card.number,
			cvc: payload.card.cvc,
		}
	};
	stripe1.customers.createSource(payload.user_token, data, function(err, card) {
		cb(err, card);
	});
};

var statusTranslator = function(charge) {
	return (charge.status === 'succeeded' && !charge.captured && !charge.invoice) ? 'authorized' :
		(charge.status === 'succeeded' && charge.captured && !charge.receipt_number) ? 'settled' :
		(charge.status === 'succeeded' && charge.captured && charge.receipt_number) ? 'settled' : 'no_status';
};

var sale_extra_transaction = function(order, amount, cb) {
	base.Order.find({
		_id: order._id
	}).populate([{
		path: 'user',
		select: 'email payment_info'
	}]).exec(function(err, order) {
		order = order[0];
		amount = Math.round(amount * 1.0 * 100);
		stripe.charges.create({
			amount: parseInt(amount),
			currency: "mxn",
			capture: false,
			metadata: {
				order_number: order.order_number,
				user: order.user.email,
			},
			receipt_email: order.user.email,
			description: 'Charge for order delta',
			customer: order.user.payment_info.stripe_id,
			source: order.payment.token,
			statement_descriptor: 'Mercadoni ' + order.order_number
		}, function(err, charge) {
			if (charge) {
				if (charge.status === 'succeeded') {
					order.pushExtraTransaction(charge.status, charge.id, amount / 100, function(err) {});
					stripe.charges.capture(charge.id, {
						amount: amount,
						receipt_email: order.user.email,
						statement_descriptor: 'Mercadoni ' + order.order_number
					}, function(err, charge) {
						var status = charge.status === 'succeeded' ? 'capture' : charge.status;
						order.pushExtraTransaction(status, charge.id, amount / 100, function(err) {
							cb(err, charge);
						});
					});
				} else order.pushExtraTransaction(charge.status, charge.id, amount / 100, function(err) {
					cb(err, charge);
				});
			} else {
				cb(null, 'no_result');
			}
		});
	});
};

var sale = function(payment, cb) {
	if (!stripe1) stripe1 = stripe(payment.security.api_key);
	var amount = Math.round(payment.amount * 1.0 * 100);
	stripe1.charges.create({
		amount: amount,
		currency: "mxn",
		capture: false,
		metadata: {
			internal_reference: payment.internal_reference,
			user: payment.source.email,
		},
		receipt_email: payment.source.email,
		description: 'Charge for service',
		customer: payment.source.user,
		source: payment.source.card,
		statement_descriptor: 'Mercadoni ' + payment.internal_reference
	}, function(err, charge) {
		if (err) return cb(err);
		if (charge.status !== 'succeeded') {
			return cb({
				msg: 'Insufficient Funds',
				codes: ['M105']
			});
		} else {
			cb(err, charge);
		}
	});
};

var submit_for_settlement = function(order_id, amount, cb) {
	base.Order.find({
		_id: order_id
	}).populate([{
		path: 'user',
		select: 'email payment_info'
	}]).exec(function(err, order) {
		order = order[0];
		stripe.charges.capture(order.transaction_id, {
			amount: parseInt(amount * 100),
			receipt_email: order.user.email,
			statement_descriptor: 'Charge for order'
		}, cb);
	});
};

var _void = function(order_id, cb) {
	base.Order.find({
		_id: order_id
	}).exec(function(err, order) {
		order = order[0];
		stripe.refunds.create({
			charge: order.transaction_id
		}, function(err, refund) {
			console.log({
				err: err,
				refund: refund
			});
			cb(err, refund);
		});
	});
};

var get_transaction = function(order_id, cb) {
	base.Order.findById(order_id, function(err, order) {
		stripe.charges.retrieve(
			order.transaction_id, cb
		);
	});
};



var delete_payment_method = function(user_id, token, cb) {
	async.waterfall([

		function(cb) {
			base.User.findOneAndUpdate({
				_id: user_id
			}, {
				$pull: {
					'payment_info.payment_methods': {
						token: token
					}
				}
			}, {
				multi: false,
				new: true
			}).exec(cb);
		},
		function(user, cb) {
			stripe.customers.deleteCard(
				user.payment_info.stripe_id,
				token,
				function(err, result) {
					cb(err, user);
				}
			);
		}
	], cb);
};

module.exports = stripe;
module.exports.getAccountByCountry = getAccountByCountry;
module.exports.createUser = createUser;
module.exports.createPaymentMethod = createPaymentMethod;
module.exports.sale = sale;
module.exports.submit_for_settlement = submit_for_settlement;
module.exports.void = _void;
module.exports.get_transaction = get_transaction;
module.exports.statusTranslator = statusTranslator;
module.exports.cardNumberFormat = cardNumberFormat;
module.exports.delete_payment_method = delete_payment_method;
module.exports.sale_extra_transaction = sale_extra_transaction;
