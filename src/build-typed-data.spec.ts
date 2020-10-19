import { constants } from 'ethers';
import { buildTypedData } from './build-typed-data';
import { EIP712_DOMAIN_DEFAULT_CHAIN_ID, EIP712_DOMAIN_DEFAULT_VERSION } from './constants';

describe('buildTypedData()', () => {
  it('expect to build typed data with flat type and default domain parameters', () => {
    const typedData = buildTypedData(
      {
        name: 'test',
      },
      'Demo',
      [{ type: 'uint256', name: 'value' }],
      {
        value: 1,
      },
    );

    expect(typedData.domain.chainId).toBe(EIP712_DOMAIN_DEFAULT_CHAIN_ID);
    expect(typedData.domain.verifyingContract).toBe(constants.AddressZero);
    expect(typedData.domain.salt).toBe(constants.HashZero);
    expect(typedData.domain.version).toBe(EIP712_DOMAIN_DEFAULT_VERSION);
    expect(typedData.types.Demo).toEqual([{ type: 'uint256', name: 'value' }]);
  });

  it('expect to build typed data with nested types', () => {
    const typedData = buildTypedData(
      {
        name: 'test',
      },
      'Demo1',
      {
        Demo1: [{ type: 'Demo2', name: 'value' }],
        Demo2: [{ type: 'uint256', name: 'value' }],
      },
      {
        value: {
          value: 1,
        },
      },
    );

    expect(typedData.domain.chainId).toBe(EIP712_DOMAIN_DEFAULT_CHAIN_ID);
    expect(typedData.domain.verifyingContract).toBe(constants.AddressZero);
    expect(typedData.domain.salt).toBe(constants.HashZero);
    expect(typedData.domain.version).toBe(EIP712_DOMAIN_DEFAULT_VERSION);
    expect(typedData.types.Demo1).toEqual([{ type: 'Demo2', name: 'value' }]);
    expect(typedData.types.Demo2).toEqual([{ type: 'uint256', name: 'value' }]);
  });
});
