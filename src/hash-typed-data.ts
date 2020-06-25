import { utils } from 'ethers';
import { TypedData } from './interfaces';
import { EIP712_DOMAIN_TYPE_NAME, EIP712_DOMAIN_TYPE_PROPERTIES, TYPED_DATA_PREFIX } from './constants';
import { buildTypeSeparator, encodeTypedData, hashTypedType, mapToTypesWithSeparators } from './internal';

export function hashTypedData(typedData: TypedData): string {
  const { domain, primaryType, types, message } = typedData;

  const domainHash = encodeTypedData(
    {
      separator: buildTypeSeparator(EIP712_DOMAIN_TYPE_NAME, EIP712_DOMAIN_TYPE_PROPERTIES),
      properties: EIP712_DOMAIN_TYPE_PROPERTIES,
    },
    domain,
  );

  const typesWithSeparators = mapToTypesWithSeparators(types);

  const { hash } = hashTypedType(primaryType, message, typesWithSeparators);

  return utils.solidityKeccak256(['string', 'bytes32', 'bytes32'], [TYPED_DATA_PREFIX, domainHash, hash]);
}
