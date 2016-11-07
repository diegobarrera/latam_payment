# latam_payment
Library to handle payment providers. At the moment, the library handles PayU and Stripe.

## Require
```
var latam_payment = require('latam_payment');
```

## Register Card Token
### PayU register example
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

### Stripe register example
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

### Register response
```json
{
    "token": "<card token>",
    "last4": "1234",
    "cardType": "VISA",
    "maskedNumber": "****1234",
    "uniqueNumberIdentifier": "jkaslgjdakl328975",
    "customer": "<stripe user token (null for PayU)>",
    "country": "MEX|COL|ARG",
    "type": "payu|stripe"
}
```