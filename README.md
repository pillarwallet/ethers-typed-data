# Ethers Typed Data

Signs typed data as per an extension of the published version of [EIP 712](https://eips.ethereum.org/EIPS/eip-712).

## Installation

```
npm install ethers-typed-data --save
```

## Usage

```typescript
import { buildTypedData, hashTypedData } from 'ethers-typed-data';

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
    ],
  },
  {
    amount: 100,
    bidder: {
      userId: 10,
      wallet: '0xEEb4801FBc9781EEF20801853C1Cb25faB8A7a3b',
    },
  },
);

console.log('typed data:', typedData);

const hash = hashTypedData(typedData);

console.log('typed data hash:', hash);
```

## License

MIT License.
