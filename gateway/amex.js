'use strict';

var request = require('request');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment-timezone');
var uuid = require('node-uuid');
var _ = require('lodash');

var GATEWAY_URL = 'https://gateway-na.americanexpress.com/api/rest/version/:apiVersion';
var API_VERSION = 40;

function getAuthHeader(credentials) {
    var username = 'merchant.' + credentials.merchantId;
    var password = credentials.password;
    var token = new Buffer(username + ':' + password).toString('base64');
    return 'Basic ' + token;
}

function getBaseUrl() {
    var url = GATEWAY_URL
        .replace(':apiVersion', API_VERSION);
    return url;
}

function getMerchantUrl(merchantId) {
    return getBaseUrl() + '/merchant/' + merchantId;
}

function getDate() {
    return new Date().toISOString().split('T')[0];
}

function handleResponse(err, res, body, cb) {
    if (typeof body === 'string') {
        body = JSON.parse(body);
    }
    if (body.error) {
        err = body.error;
        err.statusCode = res.statusCode;
        cb(err);
    } else {
        cb(null, body);
    }
}


// GATEWAY INFO

module.exports.getGatewayInfo = function getGatewayInfo(cb) {
    var baseUrl = getBaseUrl();
    var url = baseUrl + '/information';
    request({
        url: url,
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
}


// TOKENS

module.exports.getToken = function getToken(tokenId, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var url = baseUrl + '/token/' + tokenId;
    var auth = getAuthHeader(credentials);
    request({
        url: url,
        method: 'GET',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
        },
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
};

module.exports.deleteToken = function deleteToken(tokenId, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var url = baseUrl + '/token/' + tokenId;
    var auth = getAuthHeader(credentials);
    request({
        url: url,
        method: 'DELETE',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
        },
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
};

module.exports.createToken = function createToken(payload, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var url = baseUrl + '/token';
    var auth = getAuthHeader(credentials);
    request({
        url: url,
        method: 'POST',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        json: true,
        body: payload,
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
};


// ORDERS

module.exports.authorize = function authorize(orderId, payload, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var transactionId = uuid.v1();
    var url = baseUrl + '/order/' + orderId + '/transaction/' + transactionId;
    var auth = getAuthHeader(credentials);
    var data = {
        apiOperation: 'AUTHORIZE',
        customer: {
            email: payload.email,
            firstName: payload.metadata.first_name,
            lastName: payload.metadata.last_name,
            mobilePhone: payload.metadata.phone,
            phone: payload.metadata.phone,
        },
        order: {
            amount: payload.payment.amount,
            currency: payload.payment.currency,
            customerOrderDate: getDate(),
            reference: payload.payment.internal_reference,
        },
        shipping: {
            address: {
                city: payload.address.city,
                country: payload.address.country,
                postcodeZip: payload.address.postal_code,
                street: payload.address.line1,
                street2: payload.address.line2,
            },
            contact: {
                email: payload.email,
                firstName: payload.metadata.first_name,
                lastName: payload.metadata.last_name,
                mobilePhone: payload.metadata.phone,
                phone: payload.metadata.phone,
            },
        },
        sourceOfFunds: {
            token: payload.payment.source.card,
        },
    };
    request({
        url: url,
        method: 'PUT',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        json: true,
        body: data,
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
}

module.exports.capture = function capture(orderId, payload, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var transactionId = uuid.v1();
    var url = baseUrl + '/order/' + orderId + '/transaction/' + transactionId;
    var auth = getAuthHeader(credentials);
    var data = {
        apiOperation: 'CAPTURE',
        transaction: {
            amount: payload.payment.amount,
            currency: payload.payment.currency,
        },
    };
    request({
        url: url,
        method: 'PUT',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        json: true,
        body: data,
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
}

module.exports.pay = function pay(orderId, payload, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var transactionId = uuid.v1();
    var url = baseUrl + '/order/' + orderId + '/transaction/' + transactionId;
    var auth = getAuthHeader(credentials);
    var customer = {
        email: payload.email,
        firstName: payload.metadata.first_name,
        lastName: payload.metadata.last_name,
        mobilePhone: payload.metadata.phone,
        phone: payload.metadata.phone,
    };
    var order = {
        amount: payload.payment.amount,
        currency: payload.payment.currency,
        customerNote: payload.metadata.id,
        customerOrderDate: getDate(),
        reference: payload.payment.internal_reference,
    };
    var shipping = {
        address: {
            city: payload.address.city,
            country: payload.address.country,
            postcodeZip: payload.address.postal_code,
            street: payload.address.line1,
            street2: payload.address.line2,
        },
        contact: customer,
    };
    var sourceOfFunds = {
        token: payload.payment.source.card,
    };
    var data = {
        apiOperation: 'PAY',
        customer: customer,
        order: order,
        shipping: shipping,
        sourceOfFunds: sourceOfFunds,
    };
    request({
        url: url,
        method: 'PUT',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        json: true,
        body: data,
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
}

module.exports.refund = function refund(orderId, payload, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var transactionId = uuid.v1();
    var url = baseUrl + '/order/' + orderId + '/transaction/' + transactionId;
    var auth = getAuthHeader(credentials);
    var data = {
        apiOperation: 'REFUND',
        transaction: {
            amount: payload.payment.amount,
            currency: payload.payment.currency,
        },
    };
    request({
        url: url,
        method: 'PUT',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        json: true,
        body: data,
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
}

module.exports.void = function voidTransaction(orderId, targetTransactionId, credentials, cb) {
    var baseUrl = getMerchantUrl(credentials.merchantId);
    var transactionId = uuid.v1();
    var url = baseUrl + '/order/' + orderId + '/transaction/' + transactionId;
    var auth = getAuthHeader(credentials);
    var data = {
        apiOperation: 'VOID',
        transaction: {
            targetTransactionId: targetTransactionId,
        },
    };
    request({
        url: url,
        method: 'PUT',
        headers: {
            Authorization: auth,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        json: true,
        body: data,
    }, function(err, res, body) {
        handleResponse(err, res, body, cb);
    });
}
