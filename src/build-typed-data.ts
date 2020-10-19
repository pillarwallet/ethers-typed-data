import { constants } from 'ethers';
import { Domain, TypeProperty, TypedData } from './interfaces';
import {
  EIP712_DOMAIN_DEFAULT_CHAIN_ID,
  EIP712_DOMAIN_DEFAULT_VERSION,
  EIP712_DOMAIN_TYPE_NAME,
  EIP712_DOMAIN_TYPE_PROPERTIES,
} from './constants';

export function buildTypedData<M = any>(
  domain: Domain,
  primaryType: string,
  types: { [key: string]: TypeProperty[] } | TypeProperty[],
  message: M,
): TypedData<M> {
  return {
    primaryType,
    domain: {
      chainId: EIP712_DOMAIN_DEFAULT_CHAIN_ID,
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
