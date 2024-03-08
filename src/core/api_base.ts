import { Middleware, Next } from 'koa'
import { CtxBase } from './ctx_base'
import { AppBase } from './app_base'

export type RouteBaseMethod = 'all' | 'get' | 'post' | 'delete' | 'put'

export interface RouteBase<C extends CtxBase> extends Object {
  method: RouteBaseMethod,
  path: string | RegExp,
  middlewares: Middleware[],
  handler: (ctx: C, next: Next) => Promise<any>
}

export class ApiBase<A extends AppBase, C extends CtxBase> {
  constructor(app: A) {
    this.app = app
  }

  public app: A
  public routes: Record<string, RouteBase<C>>
}