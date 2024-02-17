import Router from 'koa-router'
import { Middleware, Next } from 'koa'
import { CtxBase } from './ctx_base'
import { AppBase } from './app_base'

export interface RouteBase<C extends CtxBase, Extra = any> {
  path: string | RegExp,
  tags?: string[],
  name?: string,
  intro?: string,
  extra?: Extra
  middlewares: Middleware[],
  all?: (ctx: C, next: Next) => Promise<any>,
  get?: (ctx: C, next: Next) => Promise<any>,
  post?: (ctx: C, next: Next) => Promise<any>,
  delete?: (ctx: C, next: Next) => Promise<any>,
  put?: (ctx: C, next: Next) => Promise<any>
}

export class ApiBase<A extends AppBase, C extends CtxBase> {
  constructor(app: A) {
    this.app = app
  }

  public app: A
  public routes: RouteBase<C, object>[]

  public attachApisToRouter(router: Router<any, C>) {
    this.routes.forEach(route => {
      const builtin = (ctx: C, next: Next) => {
        ctx.route = route
        next()
      }

      for (const prop of ['all', 'get', 'post', 'delete', 'put']) {
        if (route[prop]) {
          router[prop](route.path, builtin, ...route.middlewares, route[prop])
        }
      }
    })
  }
}