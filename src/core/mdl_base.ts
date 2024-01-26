import { FilterQuery, ClientSession, ProjectionType, UpdateQuery, QueryOptions } from 'mongoose'
import { ReturnModelType, getModelForClass } from '@typegoose/typegoose'
import { ObjectId } from 'mongodb'
import { AnyParamConstructor } from '@typegoose/typegoose/lib/types'

export interface Options {
  session?: ClientSession
}

export const commonSchemaOptions = {
  toJSON: { versionKey: false },
  versionKey: false
}

export class MdlBase<
  Schema,
  Doc extends Schema & { _id: ObjectId }
> {
  public Model: ReturnModelType<AnyParamConstructor<any>>

  constructor(schema) {
    this.Model = getModelForClass(schema) as ReturnModelType<typeof schema>
  }

  public async create(schema: Schema, options?: Options): Promise<Doc> {
    const model = new this.Model(schema)
    await model.save({ session: options?.session })
    return model
  }

  public async query(
    filter: FilterQuery<Doc>,
    options?: Options & {
      projection?: ProjectionType<Doc>,
      skip?: number,
      limit?: number,
      extra?: QueryOptions<Doc>
    }
  ): Promise<Doc[]> {
    if (!Object.keys(filter).length) {
      throw new Error('Invalid filter')
    }

    const queryOptions: QueryOptions<Doc> = options?.extra || {}
    queryOptions.limit = options?.limit
    queryOptions.skip = options?.skip

    return this.Model.find(filter, options?.projection, queryOptions)
      .session(options?.session || null)
      .lean()
  }

  public async get(
    filter: FilterQuery<Doc>,
    options?: Options & {
      projection?: ProjectionType<Doc>
    }
  ): Promise<Doc | null> {
    if (!Object.keys(filter).length) {
      throw new Error('Invalid filter')
    }

    const res = this.Model.findOne(filter, options?.projection)
      .session(options?.session || null)
      .lean()
    return res || null
  }

  public async update(
    filter: FilterQuery<Doc>,
    update: UpdateQuery<Doc>,
    options?: Options & {
      projection?: ProjectionType<Doc>
    }
  ): Promise<Doc | null> {
    if (!Object.keys(filter).length) {
      throw new Error('Invalid filter')
    }
  
    const res = this.Model.findOneAndUpdate(filter, update, {
      new: true,
      session: options?.session,
      projection: options?.projection
    }).lean()
    return res || null
  }
}