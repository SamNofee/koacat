import Router from 'koa-router'
import { include } from '../utils/lodash'
import { Middleware, Next } from 'koa'
import { CtxBase } from './ctx_base'
import { AppBase } from './app_base' 

export interface Route<C extends CtxBase> {
  path: string | RegExp,
  tags?: string[],
  name?: string,
  intro?: string,
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
  public routes: Route<C>[]

  public attachApisToRouter(router: Router<any, C>) {
    this.routes.forEach(api => {
      if (include(api, 'all')) router.all(api.path, ...api.middlewares, api.all!)
      if (include(api, 'get')) router.get(api.path, ...api.middlewares, api.get!)
      if (include(api, 'post')) router.post(api.path, ...api.middlewares, api.post!)
      if (include(api, 'delete')) router.delete(api.path, ...api.middlewares, api.delete!)
      if (include(api, 'put')) router.put(api.path, ...api.middlewares, api.put!)
    })
  }
}