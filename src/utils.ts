import { utils } from 'ethers';

function toBuffer(data: any): Buffer {
  let result: Buffer;

  if (utils.isHexString(data)) {
    result = Buffer.from(data.slice(2), 'hex');
  } else if (Buffer.isBuffer(data)) {
    result = data;
  } else if (Array.isArray(data)) {
    result = Buffer.from([...data]);
  } else {
    result = Buffer.from([...utils.toUtf8Bytes(data)]);
  }

  return result;
}

const ethUtil = {
  sha3: (data) => toBuffer(utils.keccak256([...toBuffer(data)])),
  toBuffer: (data) => toBuffer(data),
};

const ethAbi = {
  soliditySHA3: (...args: any[]) => toBuffer(utils.solidityKeccak256(args[0], args[1])),
  rawEncode: (...args: any[]) => toBuffer(utils.defaultAbiCoder.encode(args[0], args[1])),
};

export type TypedData = string | EIP712TypedData | EIP712TypedData[];

interface EIP712TypedData {
  name: string;
  type: string;
  value: any;
}

export type Version = 'V1' | 'V2' | 'V3' | 'V4';

export interface EthEncryptedData {
  version: string;
  nonce: string;
  ephemPublicKey: string;
  ciphertext: string;
}

export type SignedMsgParams<D> = Required<MsgParams<D>>;

export interface MsgParams<D> {
  data: D;
  sig?: string;
}

interface MessageTypeProperty {
  name: string;
  type: string;
}

interface MessageTypes {
  EIP712Domain: MessageTypeProperty[];
  [additionalProperties: string]: MessageTypeProperty[];
}

export interface TypedMessage<T extends MessageTypes> {
  types: T;
  primaryType: keyof T;
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
  };
  message: object;
}

const TYPED_MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    types: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['name', 'type'],
        },
      },
    },
    primaryType: { type: 'string' },
    domain: { type: 'object' },
    message: { type: 'object' },
  },
  required: ['types', 'primaryType', 'domain', 'message'],
};

function padWithZeroes(number: string, length: number): string {
  let myString = `${number}`;
  while (myString.length < length) {
    myString = `0${myString}`;
  }
  return myString;
}

/**
 * @param typedData - Array of data along with types, as per EIP712.
 * @returns Buffer
 */
function typedSignatureHash<T extends MessageTypes>(typedData: TypedData | TypedMessage<T>): Buffer {
  const error = new Error('Expect argument to be non-empty array');
  if (typeof typedData !== 'object' || !('length' in typedData) || !typedData.length) {
    throw error;
  }

  const data = typedData.map(function (e) {
    return e.type === 'bytes' ? ethUtil.toBuffer(e.value) : e.value;
  });
  const types = typedData.map(function (e) {
    return e.type;
  });
  const schema = typedData.map(function (e) {
    if (!e.name) {
      throw error;
    }
    return `${e.type} ${e.name}`;
  });

  return ethAbi.soliditySHA3(
    ['bytes32', 'bytes32'],
    [ethAbi.soliditySHA3(new Array(typedData.length).fill('string'), schema), ethAbi.soliditySHA3(types, data)],
  );
}

/**
 * A collection of utility functions used for signing typed data
 */
const TypedDataUtils = {
  /**
   * Encodes an object by encoding and concatenating each of its members
   *
   * @param {string} primaryType - Root type
   * @param {Object} data - Object to encode
   * @param {Object} types - Type definitions
   * @returns {Buffer} - Encoded representation of an object
   */
  encodeData(primaryType: string, data: object, types: object, useV4 = true): Buffer {
    const encodedTypes = ['bytes32'];
    const encodedValues = [this.hashType(primaryType, types)];

    if (useV4) {
      const encodeField = (name, type, value) => {
        if (types[type] !== undefined) {
          // eslint-disable-next-line no-eq-null
          return [
            'bytes32',
            value == null
              ? '0x0000000000000000000000000000000000000000000000000000000000000000'
              : ethUtil.sha3(this.encodeData(type, value, types, useV4)),
          ];
        }

        if (value === undefined) {
          throw new Error(`missing value for field ${name} of type ${type}`);
        }

        if (type === 'bytes') {
          return ['bytes32', ethUtil.sha3(value)];
        }

        if (type === 'string') {
          // convert string to buffer - prevents ethUtil from interpreting strings like '0xabcd' as hex
          if (typeof value === 'string') {
            value = Buffer.from(value, 'utf8');
          }
          return ['bytes32', ethUtil.sha3(value)];
        }

        if (type.lastIndexOf(']') === type.length - 1) {
          const parsedType = type.slice(0, type.lastIndexOf('['));
          const typeValuePairs = value.map((item) => encodeField(name, parsedType, item));
          return [
            'bytes32',
            ethUtil.sha3(
              ethAbi.rawEncode(
                typeValuePairs.map(([t]) => t),
                typeValuePairs.map(([, v]) => v),
              ),
            ),
          ];
        }

        return [type, value];
      };

      for (const field of types[primaryType]) {
        const [type, value] = encodeField(field.name, field.type, data[field.name]);
        encodedTypes.push(type);
        encodedValues.push(value);
      }
    } else {
      for (const field of types[primaryType]) {
        let value = data[field.name];
        if (value !== undefined) {
          if (field.type === 'bytes') {
            encodedTypes.push('bytes32');
            value = ethUtil.sha3(value);
            encodedValues.push(value);
          } else if (field.type === 'string') {
            encodedTypes.push('bytes32');
            // convert string to buffer - prevents ethUtil from interpreting strings like '0xabcd' as hex
            if (typeof value === 'string') {
              value = Buffer.from(value, 'utf8');
            }
            value = ethUtil.sha3(value);
            encodedValues.push(value);
          } else if (types[field.type] !== undefined) {
            encodedTypes.push('bytes32');
            value = ethUtil.sha3(this.encodeData(field.type, value, types, useV4));
            encodedValues.push(value);
          } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
            throw new Error('Arrays are unimplemented in encodeData; use V4 extension');
          } else {
            encodedTypes.push(field.type);
            encodedValues.push(value);
          }
        }
      }
    }

    return ethAbi.rawEncode(encodedTypes, encodedValues);
  },

  /**
   * Encodes the type of an object by encoding a comma delimited list of its members
   *
   * @param {string} primaryType - Root type to encode
   * @param {Object} types - Type definitions
   * @returns {string} - Encoded representation of the type of an object
   */
  encodeType(primaryType: string, types: object): string {
    let result = '';
    let deps = this.findTypeDependencies(primaryType, types).filter((dep) => dep !== primaryType);
    deps = [primaryType].concat(deps.sort());
    for (const type of deps) {
      const children = types[type];
      if (!children) {
        throw new Error(`No type definition specified: ${type}`);
      }
      result += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(',')})`;
    }
    return result;
  },

  /**
   * Finds all types within a type definition object
   *
   * @param {string} primaryType - Root type
   * @param {Object} types - Type definitions
   * @param {Array} results - current set of accumulated types
   * @returns {Array} - Set of all types found in the type definition
   */
  findTypeDependencies(primaryType: string, types: object, results: string[] = []): string[] {
    [primaryType] = primaryType.match(/^\w*/u);
    if (results.includes(primaryType) || types[primaryType] === undefined) {
      return results;
    }
    results.push(primaryType);
    for (const field of types[primaryType]) {
      for (const dep of this.findTypeDependencies(field.type, types, results)) {
        !results.includes(dep) && results.push(dep);
      }
    }
    return results;
  },

  /**
   * Hashes an object
   *
   * @param {string} primaryType - Root type
   * @param {Object} data - Object to hash
   * @param {Object} types - Type definitions
   * @returns {Buffer} - Hash of an object
   */
  hashStruct(primaryType: string, data: object, types: object, useV4 = true): Buffer {
    return ethUtil.sha3(this.encodeData(primaryType, data, types, useV4));
  },

  /**
   * Hashes the type of an object
   *
   * @param {string} primaryType - Root type to hash
   * @param {Object} types - Type definitions
   * @returns {Buffer} - Hash of an object
   */
  hashType(primaryType: string, types: object): Buffer {
    return ethUtil.sha3(this.encodeType(primaryType, types));
  },

  /**
   * Removes properties from a message object that are not defined per EIP-712
   *
   * @param {Object} data - typed message object
   * @returns {Object} - typed message object with only allowed fields
   */
  sanitizeData<T extends MessageTypes>(data: TypedData | TypedMessage<T>): TypedMessage<T> {
    const sanitizedData: Partial<TypedMessage<T>> = {};
    for (const key in TYPED_MESSAGE_SCHEMA.properties) {
      if (data[key]) {
        sanitizedData[key] = data[key];
      }
    }
    if ('types' in sanitizedData) {
      sanitizedData.types = { EIP712Domain: [], ...sanitizedData.types };
    }
    return sanitizedData as Required<TypedMessage<T>>;
  },

  /**
   * Signs a typed message as per EIP-712 and returns its sha3 hash
   *
   * @param {Object} typedData - Types message data to sign
   * @returns {Buffer} - sha3 hash of the resulting signed message
   */
  sign<T extends MessageTypes>(typedData: Partial<TypedData | TypedMessage<T>>, useV4 = true): Buffer {
    const sanitizedData = this.sanitizeData(typedData);
    const parts = [Buffer.from('1901', 'hex')];
    parts.push(this.hashStruct('EIP712Domain', sanitizedData.domain, sanitizedData.types, useV4));
    if (sanitizedData.primaryType !== 'EIP712Domain') {
      parts.push(this.hashStruct(sanitizedData.primaryType, sanitizedData.message, sanitizedData.types, useV4));
    }
    return ethUtil.sha3(Buffer.concat(parts));
  },
};

export { TYPED_MESSAGE_SCHEMA, TypedDataUtils };
