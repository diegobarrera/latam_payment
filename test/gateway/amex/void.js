var expect = require('chai').expect;
var uuid = require('node-uuid');
var amex = require('gateway/amex');

var credentials = {
    merchantId: 'TEST9353874515',
    password: 'd0f2cd569d431efcf62f5409cea56fd7',
};

var orderId, transactionId;
module.exports = function voidSuite() {
    beforeEach(function beforeEach(done) {
        orderId = uuid.v1();
        var payload = {
            email: 'test@email.com',
            payment: {
                internal_reference: 'ABC12398',
                amount: 500,
                currency: 'MXN',
                source: {
                    card: '345678156470007',
                },
            },
            metadata: {
                id: '123456789',
                first_name: 'John',
                last_name: 'Doe',
                phone: '123456789',
                country: 'MEX',
                city: 'MEX',
            },
            address: {
                line1: 'Av. Insurgentes Sur 253',
                country: 'MEX',
                city: 'MEX',
            },
        };
        amex.authorize(orderId, payload, credentials, function(err, body) {
            transactionId = body.transaction.id;
            done();
        });
    });
    afterEach(function afterEach(done) {
        amex.void(orderId, transactionId, credentials, function() {
            done();
        });
    });
    it('Void authorized payment', function test(done) {
        amex.void(orderId, transactionId, credentials, function(err, body) {
            expect(err).to.not.exist;
            expect(body.transaction.targetTransactionId).to.equal(transactionId);
            expect(body.transaction.type).to.equal('VOID_AUTHORIZATION');
            done();
        });
    });
    it('Void captured payment', function test(done) {
        var payload = {
            payment: {
                amount: 500,
                currency: 'MXN',
            },
        };
        amex.capture(orderId, payload, credentials, function() {
            amex.void(orderId, transactionId, credentials, function(err, body) {
                expect(err).to.exist;
                expect(err.statusCode).to.equal(400);
                expect(err.explanation).to.contain('Target transaction has already successfully been captured');
                done();
            });
        });
    });
    it('orderId not found', function test(done) {
        amex.void('jdklajg156156', transactionId, credentials, function(err, body) {
            expect(err).to.exist;
            expect(err.statusCode).to.equal(400);
            expect(err.explanation).to.equal('Value \'VOID\' is invalid. There is no transaction to void.');
            done();
        });
    });
    it('transactionId not found', function test(done) {
        amex.void(orderId, 'jkdlasgjl125614561', credentials, function(err, body) {
            expect(err).to.exist;
            expect(err.statusCode).to.equal(400);
            expect(err.explanation).to.contain('Target transaction ID does not match an existing transaction ID for this order.');
            done();
        });
    });
    it('Null orderId', function test(done) {
        amex.void(null, transactionId, credentials, function(err, body) {
            expect(err).to.exist;
            expect(err.statusCode).to.equal(400);
            expect(err.explanation).to.equal('Value \'VOID\' is invalid. There is no transaction to void.');
            done();
        });
    });
    it('Null transactionId', function test(done) {
        amex.void(orderId, null, credentials, function(err, body) {
            expect(err).to.exist;
            expect(err.statusCode).to.equal(400);
            expect(err.explanation).to.equal('Missing parameters');
            done();
        });
    });
};
