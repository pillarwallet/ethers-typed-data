import { constants } from 'ethers';
import { Domain, TypeProperty, TypedData } from './interfaces';
import { EIP712_DOMAIN_TYPE_NAME, EIP712_DOMAIN_TYPE_PROPERTIES, EIP712_DOMAIN_DEFAULT_VERSION } from './constants';

export function buildTypedData<M = any>(
  domain: Domain,
  primaryType: string,
  types: { [key: string]: TypeProperty[] } | TypeProperty[],
  message: M,
): TypedData<M> {
  return {
    primaryType,
    domain: {
      // default values
      chainId: 1,
      version: EIP712_DOMAIN_DEFAULT_VERSION,
      verifyingContract: constants.AddressZero,
      salt: constants.HashZero,
      ...domain,
    },
    types: {
      [EIP712_DOMAIN_TYPE_NAME]: EIP712_DOMAIN_TYPE_PROPERTIES,
      ...(Array.isArray(types) ? { [primaryType]: types } : types),
    },
    message,
  };
}
