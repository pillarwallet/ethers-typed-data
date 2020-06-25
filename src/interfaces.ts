import { EIP712_DOMAIN_TYPE_PROPERTIES, EIP712_DOMAIN_TYPE_NAME } from './constants';

export interface TypeProperty {
  name: string;
  type: string;
}

export interface TypeWithSeparator {
  separator: string;
  properties: (TypeProperty & {
    custom?: boolean;
  })[];
}

export interface Domain {
  name: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

export interface TypedData<M = any> {
  primaryType: string;
  domain: {
    version: string;
    chainId: number;
    verifyingContract: string;
    salt: string;
  };
  types: {
    [EIP712_DOMAIN_TYPE_NAME]: typeof EIP712_DOMAIN_TYPE_PROPERTIES;
    [key: string]: TypeProperty[];
  };
  message: M;
}
