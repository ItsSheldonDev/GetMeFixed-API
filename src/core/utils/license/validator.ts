import { LICENSE_KEY_REGEX } from '../../constants/license-formats';

export const validateLicenseKeyFormat = (key: string): boolean => {
  return LICENSE_KEY_REGEX.test(key);
};

export const extractLicenseInfo = (key: string) => {
  if (!validateLicenseKeyFormat(key)) {
    throw new Error('Invalid license key format');
  }

  const [prefix, year, productId, hash] = key.split('-');

  return {
    prefix,
    year: parseInt(year, 10),
    productId,
    hash,
  };
};