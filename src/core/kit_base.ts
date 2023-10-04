import { AppBase } from './app_base'

export class KitBase<A extends AppBase> {
  constructor(app: A) {
    this.app = app
  }

  public app: A
}