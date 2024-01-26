import { CtxBase } from '../core/ctx_base'

export interface ErrInfo {
  status: number,
  message: string,
  code?: string
}

export class Err extends Error {
  public errInfo: ErrInfo
  constructor(errInfo) {
    super()
    this.errInfo = errInfo
  }
}

export function presetErr<O extends Record<string, ErrInfo>>(
  module: string, config: O
): Record<keyof O, Err> {
  const mapping: any = {}
  for (const key in config) {
    mapping[key] = new Err({
      status: config[key].status,
      code: `${module.toUpperCase()}::${config[key]?.code || key.toUpperCase()}`,
      message: config[key].message
    })
  }
  return mapping as Record<keyof O, Err>
}

export const commonErr = {
  'INTERNAL_ERROR': { message: '服务器内部发生错误', status: 500 },
  'NOT_FOUND': { message: '当前访问资源找不到', status: 404 },
  'PERMISSION_DENIED': { message: '当前访问资源权限不足', status: 403 },
  'LOCKED': { message: '当前访问资源被锁定', status: 423 },
  'INVALID_PARAMS': { message: '非法的参数', status: 400 },
  'INVALID_TOKEN': { message: '请先登录', status: 401 },
}

export function resErr(ctx: CtxBase, err: Err) {
  ctx.type = 'application/json'
  ctx.body = {
    data: {},
    message: err.errInfo.message,
    code: err.errInfo.code
  }
  ctx.status = err.errInfo.status
}

export function resOK(ctx: CtxBase, data?: any, options?: {
  pure?: boolean
}) {
  ctx.type = 'application/json'
  ctx.body = options?.pure ? data : {
    data: data || {},
    message: '请求成功',
    code: 'OK'
  }
  ctx.status = 200
}

export function resHtml(ctx: CtxBase, html: string) {
  ctx.type = 'html'
  ctx.body = html
  ctx.status = 200
}