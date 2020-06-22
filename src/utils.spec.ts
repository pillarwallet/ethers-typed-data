import hashTypedData from './utils';
import { TypedDataUtils as TypedDataUtilsOriginal } from 'eth-sig-util';

it('expect to generate same hash', async () => {
  const typedData: any = {
    primaryType: 'Demo',
    domain: {
      verifyingContract: '0xEEb4801FBc9781EEF20801853C1Cb25faB8A7a3b',
      chainId: 1,
      name: 'Demo',
      version: '4',
    },
    types: {
      EIP712Domain: [
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
      ],
      Demo: [
        {
          name: 'value',
          type: 'uint256',
        },
      ],
    },
    message: {
      value: 1,
    },
  };

  expect(hashTypedData(typedData).toString('hex')).toBe(TypedDataUtilsOriginal.sign(typedData).toString('hex'));
});
