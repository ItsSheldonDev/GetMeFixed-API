// src/tests/api-test.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Charger les variables d'environnement
dotenv.config();

class ApiTester {
  private baseUrl: string;
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private licenseId: string | null = null;
  private licenseKey: string | null = null;
  private planId: string | null = null;
  private pluginId: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000/api/v1') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    requireAuth: boolean = false
  ): Promise<AxiosResponse<T>> {
    const headers: Record<string, string> = {};
    
    if (requireAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data,
        headers,
      });

      console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ ${method} ${endpoint} - Status: ${error.response?.status}`);
        console.error('Error details:', error.response?.data);
      } else {
        console.error(`❌ ${method} ${endpoint} - Unexpected error:`, error);
      }
      throw error;
    }
  }

  public async testHealth(): Promise<void> {
    console.log('\n=== Testing Health Endpoint ===');
    await this.request('GET', '/health');
  }

  public async testAuthentication(): Promise<void> {
    console.log('\n=== Testing Authentication ===');
    
    const loginResponse = await this.request('POST', '/auth/login', {
      email: 'admin@getmefixed.com',
      password: 'admin123',
    });
    
    this.token = loginResponse.data.token;
    this.refreshToken = loginResponse.data.refreshToken;
    
    console.log('Token obtained:', this.token?.slice(0, 20) + '...');
    
    if (this.refreshToken) {
      const refreshResponse = await this.request('POST', '/auth/refresh-token', {
        refreshToken: this.refreshToken,
      });
      
      this.token = refreshResponse.data.token;
      console.log('Token refreshed successfully');
    }
  }

  public async testLicensePlans(): Promise<void> {
    console.log('\n=== Testing License Plans ===');
    
    const plansResponse = await this.request('GET', '/license-plans', undefined, true);
    
    if (plansResponse.data.length > 0) {
      this.planId = plansResponse.data[0].id;
      console.log('Plan ID obtained:', this.planId);
      
      await this.request('GET', `/license-plans/${this.planId}`, undefined, true);
      
      const newPlanId = uuidv4();
      await this.request('POST', '/license-plans', {
        name: 'Test Plan',
        identifier: 'TST',
        tokens: 200,
        description: 'Plan de test',
        price: 19.99,
      }, true);
      
      await this.request('PUT', `/license-plans/${this.planId}`, {
        price: 24.99,
      }, true);
    }
  }

  public async testLicenses(): Promise<void> {
    console.log('\n=== Testing Licenses ===');
    
    if (this.planId) {
      // Générer une date d'expiration dans 1 an
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      
      const generateResponse = await this.request('POST', '/licenses/generate', {
        planId: this.planId,
        expirationDate: expirationDate.toISOString(),
        customerId: 'test-customer',
        metadata: { test: true },
      }, true);
      
      this.licenseId = generateResponse.data.id;
      this.licenseKey = generateResponse.data.key;
      
      console.log('License ID obtained:', this.licenseId);
      console.log('License Key obtained:', this.licenseKey);
      
      await this.request('GET', '/licenses?page=1&limit=10', undefined, true);
      
      if (this.licenseId) {
        await this.request('GET', `/licenses/${this.licenseId}`, undefined, true);
        await this.request('GET', `/licenses/${this.licenseId}/history`, undefined, true);
      }
      
      if (this.licenseKey) {
        await this.request('GET', `/licenses/validate/${this.licenseKey}`, undefined, true);
      }
    }
  }

  public async testPublicEndpoints(): Promise<void> {
    console.log('\n=== Testing Public Endpoints ===');
    
    if (this.licenseKey) {
      const machineId = 'TESTMACHINE-123';
      
      await this.request('POST', '/public/validate', {
        licenseKey: this.licenseKey,
        machineId,
      });
      
      await this.request('POST', '/public/heartbeat', {
        licenseKey: this.licenseKey,
        machineId,
      });
      
      await this.request('POST', '/public/consume-token', {
        licenseKey: this.licenseKey,
        machineId,
        tokens: 1,
        reason: 'Test consumption',
      });
      
      await this.request('POST', '/public/info', {
        licenseKey: this.licenseKey,
        machineId,
      });
    }
  }

  public async testPlugins(): Promise<void> {
    console.log('\n=== Testing Plugins ===');
    
    const pluginsResponse = await this.request('GET', '/plugins');
    
    if (pluginsResponse.data.length > 0) {
      this.pluginId = pluginsResponse.data[0].id;
      console.log('Plugin ID obtained:', this.pluginId);
      
      await this.request('GET', `/plugins/${this.pluginId}`, undefined, true);
    }
    
    if (this.pluginId && this.licenseKey) {
      await this.request('POST', '/plugins/activate', {
        licenseKey: this.licenseKey,
        pluginId: this.pluginId,
      }, true);
      
      await this.request('GET', `/plugins/status/${this.licenseKey}/${this.pluginId}`);
    }
  }

  public async testPayments(): Promise<void> {
    console.log('\n=== Testing Payments ===');
    
    if (this.planId) {
      await this.request('POST', '/payments/create-checkout', {
        planId: this.planId,
        email: 'test@example.com',
      }, true);
    }
  }

  public async testFreeTrial(): Promise<void> {
    console.log('\n=== Testing Free Trial ===');
    
    if (this.planId) {
      await this.request('POST', '/licenses/free-trial', {
        email: 'test@example.com',
        name: 'Test User',
        planId: this.planId,
      });
    }
  }

  public async runAllTests(): Promise<void> {
    try {
      console.log('🚀 Starting API tests on', this.baseUrl);
      
      await this.testHealth();
      await this.testAuthentication();
      await this.testLicensePlans();
      await this.testLicenses();
      await this.testPublicEndpoints();
      await this.testPlugins();
      await this.testPayments();
      await this.testFreeTrial();
      
      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Tests failed:', error);
    }
  }
}

// Exécuter les tests
const apiUrl = process.env.API_URL || 'http://localhost:3000/api/v1';
const tester = new ApiTester(apiUrl);
tester.runAllTests();