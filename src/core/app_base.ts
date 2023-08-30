import Koa, { Next } from 'koa'
import { CtxBase } from './ctx_base'
import Router from 'koa-router'
import koaBody from 'koa-body'

/**
 * Opstions pass to Koa, See https://koajs.com
 * @date 2023/6/13 - 11:21:50
 *
 * @export
 * @interface KoaOptions
 * @typedef {KoaOptions}
 */
export interface KoaOptions {
  /**
   * Env, production or dev
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?string}
   */
  env?: string,
  /**
   * Keys
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?string[]}
   */
  keys?: string[],
  /**
   * Proxy of Koa
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?boolean}
   */
  proxy?: boolean,
  /**
   * Sub domain offset
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?number}
   */
  subdomainOffset?: number,
  /**
   * Proxy hreader
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?string}
   */
  proxyIpHeader?: string,
  /**
   * Max ip counts
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?number}
   */
  maxIpsCount?: number
}

/**
 * Options for create Koacat app
 * @date 2023/6/13 - 11:21:50
 *
 * @export
 * @interface AppOptions
 * @typedef {AppOptions}
 * @template O
 */
export interface AppOptions<O = any> {
  /**
   * Opstions pass to Koa
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?KoaOptions}
   */
  koaOptions?: KoaOptions,

  koaBodyOptions?: koaBody.IKoaBodyOptions,
  /**
   * Port to listen, default: 80
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?number}
   */
  port?: number,
  /**
   * Is create a new instance of App
   * @date 2023/6/13 - 11:27:59
   *
   * @type {?boolean}
   */
  refresh?: boolean,
  /**
   * Error handler
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?ErrHandlerFn}
   */
  errHandlerFn?: ErrHandlerFn,
  /**
   * Is mount koa-rounter middleware
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?boolean}
   */
  mountRouter?: boolean,
  /**
   * Is mount koa-body middleware
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?boolean}
   */
  mountBodyParser?: boolean,
  /**
   * The hook will be run after init app
   * @date 2023/6/13 - 11:21:50
   *
   * @type {?(app: AppBase & O) => Promise<any>}
   */
  onMounted?: (app: AppBase & O) => Promise<any>
}

/**
 * Error handler
 * @date 2023/6/13 - 11:21:50
 *
 * @export
 * @typedef {ErrHandlerFn}
 */
export type ErrHandlerFn = (err: any, ctx: CtxBase) => any


/**
 * Description placeholder
 * @date 2023/6/13 - 11:21:50
 *
 * @export
 * @class AppBase
 * @typedef {AppBase}
 * @extends {Koa}
 */
export class AppBase extends Koa {
  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @static
   * @type {*}
   */
  static createdApp

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @static
   * @async
   * @template O
   * @param {?AppOptions<O>} [options]
   * @returns {Promise<AppBase & O>}
   */
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

  /**
   * Creates an instance of AppBase.
   * @date 2023/6/13 - 11:21:50
   *
   * @constructor
   * @param {?KoaOptions} [koaOptions]
   */
  constructor(koaOptions?: KoaOptions) {
    super(koaOptions)
  }

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @private
   * @type {boolean}
   */
  private _isRuning = false

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @public
   * @type {number}
   */
  public port = 8080

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @public
   * @type {Router<any, CtxBase>}
   */
  public router: Router<any, CtxBase>

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @public
   */
  public run() {
    if (this._isRuning) {
      return
    }
    
    this.listen(this.port)
    this._isRuning = true
  }

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @public
   * @param {?ErrHandlerFn} [fn]
   */
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

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @public
   */
  public mountRouter() {
    this.router = new Router()
    this.use(this.router.routes())
  }

  /**
   * Description placeholder
   * @date 2023/6/13 - 11:21:50
   *
   * @public
   */
  public mountBodyParser(options?: koaBody.IKoaBodyOptions) {
    this.use(koaBody(options))
  }
}