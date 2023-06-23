import Ajv, { JSONSchemaType, KeywordDefinition } from 'ajv'
import { Err, commonErr } from './res'

export interface Paging {
  skip?: number,
  limit?: number
}

export const paging = {
  skip: { type: 'number', nullable: true },
  limit: { type: 'number', nullable: true },
} as const

const objectIdKeyword: KeywordDefinition = {
  type: 'string',
  keyword: 'objectId',
  validate: (schema: any, data: any) => {
    try {
      return /^([a-f]|\d){24}$/.test(data)
    } catch (err) {
      return false
    }
  },
  errors: false
}

const isoDateKeyword: KeywordDefinition = {
  type: 'string',
  keyword: 'isoDate',
  validate: (schema: any, data: any) => {
    try {
      return /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.test(data)
    } catch (err) {
      return false
    }
  },
  errors: false
}


const ajv = new Ajv({
  coerceTypes: true,
  allowUnionTypes: true
}).addKeyword('objectId', objectIdKeyword)
  .addKeyword('isoDate', isoDateKeyword)

export function valid<T>(schema: JSONSchemaType<T>, data): T {
  const validate = ajv.compile<T>(schema)

  if(!validate(data)) {
    console.log(validate.errors)
    throw new Err(commonErr['INVALID_PARAMS'])
  }

  return data as T
}