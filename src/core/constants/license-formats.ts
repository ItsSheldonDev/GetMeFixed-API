export const LICENSE_KEY_REGEX = /^GMF-\d{4}-[A-Z]{3}-[0-9A-F]{8}$/;

export const PRODUCT_IDENTIFIERS = {
  BASIC: 'BSC',
  PRO: 'PRO',
  ENTERPRISE: 'ENT',
  PRO_PLUS: 'PRP',
} as const;

export const LICENSE_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;

export const LICENSE_ACTIONS = {
  VALIDATE: 'VALIDATE',
  CONSUME_TOKEN: 'CONSUME_TOKEN',
  HEARTBEAT: 'HEARTBEAT',
} as const;

// Types pour TypeScript
export type ProductIdentifier = typeof PRODUCT_IDENTIFIERS[keyof typeof PRODUCT_IDENTIFIERS];
export type LicenseStatus = typeof LICENSE_STATUS[keyof typeof LICENSE_STATUS];
export type LicenseAction = typeof LICENSE_ACTIONS[keyof typeof LICENSE_ACTIONS];

// Interfaces
export interface LicenseInfo {
  prefix: string;
  year: number;
  productId: ProductIdentifier;
  hash: string;
}

export interface LicenseUsageMetadata {
  timestamp: string;
  reason?: string;
  success?: boolean;
  tokens?: number;
  machineInfo?: {
    os?: string;
    hostname?: string;
    version?: string;
  };
}