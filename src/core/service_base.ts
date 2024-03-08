import { ApiBase } from './api_base'
import { AppBase } from './app_base'
import { CtxBase } from './ctx_base'

export class ServiceBase<Api extends ApiBase<AppBase, CtxBase>> {
  public api: Api
  public readonly name: string

  constructor(name: string) {
    this.name = name
  }
}