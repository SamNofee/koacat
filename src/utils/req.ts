export type Req = (method: 'post' | 'get' | 'delete' | 'put', url: string, options?: {
  data?: any,
  noToken?: boolean,
  pure?: boolean
}) => Promise<any>