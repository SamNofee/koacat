import Koa, { Next } from 'koa'
import { CtxBase } from './ctx_base'
import Router from 'koa-router'
import koaBody from 'koa-body'

export interface KoaOptions {
  env?: string,
  keys?: string[],
  proxy?: boolean,
  subdomainOffset?: number,
  proxyIpHeader?: string,
  maxIpsCount?: number
}

export interface AppOptions<O = any> {
  koaOptions?: KoaOptions,
  koaBodyOptions?: koaBody.IKoaBodyOptions,
  port?: number,
  refresh?: boolean,
  errHandlerFn?: ErrHandlerFn,
  mountRouter?: boolean,
  mountBodyParser?: boolean,
  onMounted?: (app: AppBase & O) => Promise<any>
}

export type ErrHandlerFn = (err: any, ctx: CtxBase) => any

export class AppBase extends Koa {

  static createdApp

  static async createApp<O>(options?: AppOptions<O>): Promise<AppBase & O>  {
    if (AppBase.createdApp && !options?.refresh) {
      return AppBase.createdApp as AppBase & O
    }

    const app = new AppBase(options?.koaOptions) as AppBase & O

    app.mountErrHandler(options?.errHandlerFn)

    if (options?.port) app.port = options.port

    if (options?.mountBodyParser) app.mountBodyParser(options?.koaBodyOptions)
    if (options?.mountRouter) app.mountRouter()
  
    if (options?.onMounted) await options.onMounted(app)

    if (!options?.refresh) {
      AppBase.createdApp = app
    }

    return app
  }

  constructor(koaOptions?: KoaOptions) {
    super(koaOptions)
  }

  private _isRuning = false

  public port = 8080

  public router: Router<any, CtxBase>

  public run() {
    if (this._isRuning) {
      return
    }
    
    this.listen(this.port)
    this._isRuning = true
  }

  public mountErrHandler(fn?: ErrHandlerFn) {
    this.use(async (ctx: CtxBase, next: Next) => {
      try {
        await next()
      } catch (err) {
        if (fn) {
          await fn(err, ctx)
        } else {
          throw err
        }
      }
    })
  }

  public mountRouter() {
    this.router = new Router()
    this.use(this.router.routes())
  }

  public mountBodyParser(options?: koaBody.IKoaBodyOptions) {
    this.use(koaBody(options))
  }
}