import axios, { AxiosInstance } from 'axios';

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passKey: string;
  shortCode: string;
  environment: 'sandbox' | 'production';
}

export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  callbackUrl: string;
  accountReference: string;
  transactionDesc: string;
}

export interface MpesaResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaClient {
  private http: AxiosInstance;
  private config: MpesaConfig;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: MpesaConfig) {
    this.config = config;
    const baseURL = config.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';

    this.http = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  /**
   * Generates or retrieves a cached OAuth token from Daraja
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }

    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString('base64');

    try {
      const response = await this.http.get('/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` },
      });

      this.token = response.data.access_token;
      // Set expiry to 1 minute before actual expiry for safety
      this.tokenExpiry = now + parseInt(response.data.expires_in) * 1000 - 60000;
      return this.token!;
    } catch (error: any) {
      throw new Error(`Failed to authenticate with Daraja: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  private getTimestamp(): string {
    return new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
  }

  /**
   * Initiates an STK Push (Lipa Na M-Pesa Online)
   */
  async stkPush(params: StkPushRequest): Promise<MpesaResponse> {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = Buffer.from(
      `${this.config.shortCode}${this.config.passKey}${timestamp}`
    ).toString('base64');

    const body = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(params.amount),
      PartyA: params.phoneNumber,
      PartyB: this.config.shortCode,
      PhoneNumber: params.phoneNumber,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    };

    try {
      const response = await this.http.post('/mpesa/stkpush/v1/processrequest', body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Queries the status of an STK Push transaction
   */
  async queryStkStatus(checkoutRequestId: string): Promise<any> {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = Buffer.from(
      `${this.config.shortCode}${this.config.passKey}${timestamp}`
    ).toString('base64');

    const body = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await this.http.post('/mpesa/stkpushquery/v1/query', body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}