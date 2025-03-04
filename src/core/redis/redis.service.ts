import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const redisUrl = this.configService.get<string>('redis.url') || 'redis://localhost:6379';
    this.logger.log(`Configuration Redis: ${redisUrl}`);
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          this.logger.warn(`Tentative de reconnexion Redis (${retries})`);
          return Math.min(retries * 100, 3000); // temps croissant entre les tentatives, max 3s
        },
      }
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
      this.isConnecting = false;
    });
    
    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });
    
    this.client.on('ready', () => {
      this.logger.log('Redis Client Ready');
      this.isConnecting = false;
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (err) {
      this.logger.error('Failed to connect to Redis during module initialization');
      // On ne relance pas l'erreur pour que l'application continue de démarrer
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnect();
    } catch (err) {
      this.logger.error('Error disconnecting from Redis', err);
    }
  }

  private async connect(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      await this.connectionPromise;
      return;
    }

    this.isConnecting = true;

    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error('Failed to connect to Redis', err);
      this.isConnecting = false;
      throw err;
    } finally {
      this.connectionPromise = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
      this.logger.log('Redis Client Disconnected');
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cached value for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      await this.ensureConnection();
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Error setting cached value for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.client.isOpen) {
      this.logger.warn('Redis connection not open, attempting to connect');
      await this.connect();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureConnection();
      const pong = await this.client.ping();
      this.logger.log(`Redis test ping result: ${pong}`);
      
      await this.client.set('test', 'Hello from Redis!');
      const value = await this.client.get('test');
      this.logger.log(`Redis test value: ${value}`);
      
      return true;
    } catch (error) {
      this.logger.error('Redis connection test failed:', error);
      return false;
    }
  }
}