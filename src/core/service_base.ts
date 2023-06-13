import { ApiBase } from './api_base'
import { AppBase } from './app_base'
import { CtxBase } from './ctx_base'

export class ServiceBase<Api extends ApiBase<AppBase, CtxBase>> {
  static serviceCaches: Record<string, boolean> = {}

  public api: Api
  public readonly name: string

  constructor(name: string) {
    if (ServiceBase.serviceCaches.hasOwnProperty(name)) {
      throw new Error(`Service ${name} could not new twice`)
    }

    this.name = name
    ServiceBase.serviceCaches[name] = true
  }
}