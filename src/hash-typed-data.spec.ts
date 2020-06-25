import { buildTypedData } from './build-typed-data';
import { hashTypedData } from './hash-typed-data';
import { TypedDataUtils } from 'eth-sig-util';

describe('hashTypedData()', () => {
  it('expect to return correct hash for flat type', () => {
    const typedData = buildTypedData(
      {
        name: 'test',
      },
      'Identity',
      {
        Identity: [{ type: 'uint256', name: 'userId' }],
      },
      {
        userId: 100,
      },
    );

    expect(hashTypedData(typedData)).toBe(`0x${TypedDataUtils.sign(typedData).toString('hex')}`);
  });

  it('expect to return correct hash for nested types', () => {
    const typedData = buildTypedData(
      {
        name: 'test',
      },
      'Bid',
      {
        Identity: [
          { type: 'uint256', name: 'userId' },
          { type: 'address', name: 'wallet' },
        ],
        Bid: [
          { type: 'uint256', name: 'amount' },
          { type: 'Identity', name: 'bidder' },
          { type: 'bytes[]', name: 'aaa' },
          { type: 'address[]', name: 'bbb' },
        ],
      },
      {
        amount: 100,
        bidder: {
          userId: 10,
          wallet: '0xEEb4801FBc9781EEF20801853C1Cb25faB8A7a3b',
        },
        aaa: ['0x010203', '0x010203', '0x010203'],
        bbb: ['0xEEb4801FBc9781EEF20801853C1Cb25faB8A7a3b', '0xEEb4801FBc9781EEF20801853C1Cb25faB8A7a3b'],
      },
    );

    expect(hashTypedData(typedData)).toBe(`0x${TypedDataUtils.sign(typedData).toString('hex')}`);
  });
});
