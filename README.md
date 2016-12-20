# latam_payment
Library to handle payment providers. At the moment, the library handles PayU and Stripe.

## Require
```
var latam_payment = require('latam_payment');
```

## Register Card Token
#### PayU register example
```javascript
var type = 'payu';
var data = {
  email: 'some_email@test.com',
  metadata: {
    id: 'user id 1',
    first_name: 'John',
    last_name: 'Doe',
    country: 'COL',
    city: 'BOG'
  },
  description: `Customer for some_email@test.com`,
  card: '<payu token>',
  user_token: null,
  security: {
    url: 'https://sandbox.api.payulatam.com/payments-api/4.0/service.token',
    api_login: 'pRRXKOl8ikMmt9u',
    api_key: '4Vj8eK4rloUd272L48hsrarnUA'
  }
};
latam_payment.register(type, data, function(err, card){
    // do something with card
});
```

#### Stripe register example
```javascript
var type = 'stripe';
var data = {
  email: 'some_email@test.com',
  metadata: {
    id: 'user id 1',
    first_name: 'John',
    last_name: 'Doe',
    country: 'MEX',
    city: 'MEX'
  },
  description: `Customer for some_email@test.com`,
  card: '<stripe token>',
  user_token: '<customer stripe token (if exists)>',
  security: {
    api_key: '<stripe api key>',
  }
};
latam_payment.register(type, data, function(err, card){
    // do something with card
});
```

#### Register response
```json
{
    "token": "<card token>",
    "last4": "1234",
    "cardType": "VISA",
    "maskedNumber": "****1234",
    "uniqueNumberIdentifier": "jkaslgjdakl328975",
    "customer": "<stripe user token (null for PayU)>|null",
    "country": "MEX|COL|ARG",
    "type": "payu|stripe",
    "csv": "123|null"
}
```

##Checkout
####PayU checkout example
```javascript
var type = 'payu';
var data = {
  email: 'test@email.com',
  payment: {
    internal_reference: 'ABC12398',
    amount: 500,
    source: {
      user: null,
      card: 'f064b5d0-2fbb-43df-b54f-ab92a3796a5c'
    },
    cvc: '123', //optional for Colombia
    card_type: 'VISA',
    mode: 'AUTHORIZATION' //Colombia only accepts 'AUTHORIZATION_AND_CAPTURE'; if not present, defaults to 'AUTHORIZATION_AND_CAPTURE'
  },
  metadata: {
    id: '123456789',// user id
    first_name: 'John',
    last_name: 'Doe',
    phone: '123456789',
    country: 'ARG',
    city: 'BNA'
  },
  address: {
    line1: 'Avenida entre rios 256',
    country: 'ARG',
    city: 'BNA'
  },
  security: {
    url: 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi',
    account_id: '512322',
    merchant_id: '508029',
    api_key: '4Vj8eK4rloUd272L48hsrarnUA',
    api_login: 'pRRXKOl8ikMmt9u',
    ip: '127.0.0.1',
    device_session_id: 'vghs6tvkcle931686k1900o6e1',
    user_agent: 'Mozilla/5.0 (Windows NT 5.1; rv:18.0) Gecko/20100101 Firefox/18.0'
  }
};
latam_payment.checkout(type, data, function(err, transaction){
    // do something with transaction
});
```

####Stripe checkout example
```javascript
var type = 'stripe';
var data = {
  email: 'test@email.com',
  payment: {
    internal_reference: 'ABC12398',
    amount: 500,
    source: {
      user: 'cus_jkds78392ufdsa78',
      card: 'card_jdk789236fdjk39'
    },
    mode: 'capture' // if equal to 'capture', sets capture=true; else, sets capture=false
  },
  metadata: {
    id: '123456789',// user id
    first_name: 'John',
    last_name: 'Doe',
    phone: '123456789',
    country: 'ARG',
    city: 'BNA'
  },
  address: {
    line1: 'Avenida entre rios 256',
    country: 'ARG',
    city: 'BNA'
  },
  security: {
    api_key: '<stripe api key>',
  }
};
latam_payment.checkout(type, data, function(err, transaction){
    // do something with transaction
});
```

#### Checkout response
**NOTE:** `orderId` is null for Stripe transactions.
```json
{
  "success": true,
  "error": null,
  "body": {
    "orderId": "<payuOrderId>",
    "transaction": "<transaction id>",
    "status": "paid|authorized",
    "amount": 500
  }
}
```
