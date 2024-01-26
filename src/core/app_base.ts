import Koa, { Next } from 'koa'
import { CtxBase } from './ctx_base'
import Router from 'koa-router'
import koaBody from 'koa-body'

export const LogLevelSet = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const
export type LogLevel = (typeof LogLevelSet)[number]

export type Log = (level: LogLevel, message: string) => void

export type ErrorHandler = (err: any, ctx: CtxBase) => any

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
  mountRouter?: boolean,
  mountBodyParser?: boolean,
  errorHandler?: ErrorHandler,
  log?: Log,
  onMounted?: (app: AppBase & O) => Promise<any>
}

export class AppBase extends Koa {

  static createdApp

  static async createApp<O>(options?: AppOptions<O>): Promise<AppBase & O>  {
    if (AppBase.createdApp && !options?.refresh) {
      return AppBase.createdApp as AppBase & O
    }

    const app = new AppBase(options?.koaOptions) as AppBase & O

    app.mountErrHandler(options?.errorHandler)

    if (options?.log) app.log = options.log
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

  private isRuning = false

  public port = 8080

  public router: Router<any, CtxBase>

  public log: Log = (level: LogLevel, message: string) => console.log(level, message)

  public run() {
    if (this.isRuning) {
      return
    }
    
    this.listen(this.port)
    this.isRuning = true
  }

  public mountErrHandler(fn?: ErrorHandler) {
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