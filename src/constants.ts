export const TYPED_DATA_PREFIX = '\x19\x01';

export const EIP712_DOMAIN_DEFAULT_VERSION = '4';

export const EIP712_DOMAIN_TYPE_NAME = 'EIP712Domain';

export const EIP712_DOMAIN_TYPE_PROPERTIES = [
  {
    name: 'name',
    type: 'string',
  },
  {
    name: 'version',
    type: 'string',
  },
  {
    name: 'chainId',
    type: 'uint256',
  },
  {
    name: 'verifyingContract',
    type: 'address',
  },
  {
    name: 'salt',
    type: 'bytes32',
  },
];
