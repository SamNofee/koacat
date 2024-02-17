import { Context } from 'koa'
import { RouteBase } from './api_base'

export type CtxBase = Context & {
  route: RouteBase<any>
}