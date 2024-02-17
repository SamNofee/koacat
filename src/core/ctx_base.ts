import { Context } from 'koa'
import { Route } from './api_base'

export type CtxBase = Context & {
  route: Route<any>
}