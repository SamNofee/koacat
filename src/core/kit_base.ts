import { ApiBase } from './api_base'
import { AppBase } from './app_base'
import { CtxBase } from './ctx_base'
import { ServiceBase } from './service_base'

export class KitBase<O extends ServiceBase<ApiBase<AppBase, CtxBase>>> {
  constructor(service: O) {
    this.service = service
  }

  public service: O
}