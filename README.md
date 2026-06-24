# mpesa-sdk-ts-20260624c

A modern, type-safe TypeScript utility library for integrating Safaricom's Daraja API.

## Features
- **Full Type Safety**: Written in TypeScript with exhaustive interfaces.
- **Automated Token Management**: Handles OAuth2 token generation and caching internally.
- **STK Push**: Simple interface for Lipa Na M-Pesa Online.
- **Transaction Querying**: Easily check the status of requests.

## Installation
```bash
npm install mpesa-sdk-ts-20260624c
```

## Quick Start

```typescript
import { MpesaClient } from 'mpesa-sdk-ts-20260624c';

const client = new MpesaClient({
  consumerKey: 'YOUR_KEY',
  consumerSecret: 'YOUR_SECRET',
  passKey: 'YOUR_PASSKEY',
  shortCode: '174379',
  environment: 'sandbox'
});

async function pay() {
  try {
    const response = await client.stkPush({
      phoneNumber: '2547XXXXXXXX',
      amount: 1,
      callbackUrl: 'https://yourdomain.com/callback',
      accountReference: 'Order_123',
      transactionDesc: 'Payment for services'
    });
    console.log(response.CheckoutRequestID);
  } catch (err) {
    console.error(err);
  }
}
```

## API Reference

### `new MpesaClient(config)`
Initializes the client. Environment can be `'sandbox'` or `'production'`.

### `stkPush(params)`
Initiates a SIM-Toolkit prompt on the user's phone.

### `queryStkStatus(checkoutRequestId)`
Checks the status of an existing STK Push request.