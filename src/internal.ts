import { utils } from 'ethers';
import { EIP712_DOMAIN_TYPE_NAME } from './constants';
import { TypedData, TypeProperty, TypeWithSeparator } from './interfaces';

const { defaultAbiCoder: abiCoder } = utils;

function prepareType(type: string, value: any, custom = false): { type: string; value: any } {
  if (type === 'string' || type === 'bytes') {
    value = utils.solidityKeccak256([type], [value]);
    type = 'bytes32';
  } else if (type.endsWith(']') && Array.isArray(value)) {
    if (custom) {
      throw new Error('Nested custom types not supported');
    }

    const items = value.map((item) => prepareType(type.slice(0, type.indexOf('[')), item));
    const hashType = `${items[0].type}[]`;

    value = utils.solidityKeccak256([hashType], [items.map(({ value }) => value)]);
    type = 'bytes32';
  } else if (custom) {
    type = 'bytes32';
  }

  return {
    type,
    value,
  };
}

export function buildTypeSeparator(name: string, properties: TypeProperty[]): string {
  return `${name}(${properties.map(({ type, name }) => `${type} ${name}`).join(',')})`;
}

export function encodeTypedData({ separator, properties }: TypeWithSeparator, data: any): string {
  const { type, value } = prepareType('string', separator);

  const types: string[] = [type];
  const values: any[] = [value];

  for (const property of properties) {
    const { type, value } = prepareType(property.type, data[property.name], property.custom);

    types.push(type);
    values.push(value);
  }
  return utils.solidityKeccak256(['bytes'], [abiCoder.encode(types, values)]);
}

export function mapToTypesWithSeparators(types: TypedData['types']): { [key: string]: TypeWithSeparator } {
  const result: { [key: string]: TypeWithSeparator } = {};

  const names = Object.keys(types);

  for (const name of names) {
    if (name !== EIP712_DOMAIN_TYPE_NAME) {
      result[name] = {
        separator: buildTypeSeparator(name, types[name]),
        properties: types[name].map(({ type, name }) => ({
          custom: !!types[type],
          type,
          name,
        })),
      };
    }
  }

  return result;
}

export function hashTypedType(
  name: string,
  message: any,
  typesWithSeparators: { [key: string]: TypeWithSeparator },
): {
  hash: string;
  separator: string;
} {
  const typeWithSeparator = typesWithSeparators[name];

  let currentSeparator = typeWithSeparator.separator;
  const data: any = {};

  for (const property of typeWithSeparator.properties) {
    const { type, name } = property;

    if (typesWithSeparators[type]) {
      const { hash, separator } = hashTypedType(type, message[name], typesWithSeparators);
      data[name] = hash;
      currentSeparator = `${currentSeparator}${separator}`;
    } else {
      data[name] = message[name];
    }
  }

  const hash = encodeTypedData(
    {
      properties: typeWithSeparator.properties,
      separator: currentSeparator,
    },
    data,
  );

  return {
    hash,
    separator: currentSeparator,
  };
}
