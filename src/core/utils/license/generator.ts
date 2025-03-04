import * as crypto from 'crypto';
import { PRODUCT_IDENTIFIERS } from '../../constants/license-formats';

export const generateLicenseKey = async (productIdentifier: string): Promise<string> => {
  if (!Object.values(PRODUCT_IDENTIFIERS).includes(productIdentifier as any)) {
    throw new Error('Invalid product identifier');
  }

  const year = new Date().getFullYear().toString();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();

  return `GMF-${year}-${productIdentifier}-${randomBytes}`;
};