# Ethers Typed Data

Signs typed data as per an extension of the published version of [EIP 712](https://eips.ethereum.org/EIPS/eip-712).

## Installation

```
npm install ethers-typed-data --save
```

## Usage

```javascript
import hashTypedData from 'ethers-typed-data';

const typedData = {
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
const hash = hashTypedData(typedData).toString('hex');
```
