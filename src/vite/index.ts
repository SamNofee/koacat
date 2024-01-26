import { build as buildForProduction, InlineConfig } from 'vite'
import { include } from '../utils/helper'
import { exist, read, write, cwd, createDir, dirname, join, relative } from '../utils/fs'
import _ from 'lodash'
import { createServer, ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import Koa from 'koa'
import connect from 'koa-connect'
import send from 'koa-send'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { setup } from '@css-render/vue3-ssr'
import { fileURLToPath } from 'url'

export interface ViteConfig {
  env?: 'default' | 'production',
  clientDir?: string,
  serverDir?: string,
  tempDir?: string,
  customHead?: string,
  vite?: InlineConfig,
  viteClient?: InlineConfig,
  viteServer?: InlineConfig,
}

interface MappingItem {
  source: string,
  htmlTempPath: string,
  vuePath: string
}

const defaultViteConfig: ViteConfig = {
  env: 'default',
  clientDir: 'build/client',
  serverDir: 'build/server',
  tempDir: 'build/temp',
  vite: {
    root: cwd('/'),
    base: '/vite/',
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [ vue() ]
  },
  viteClient: {
    build: {
      outDir: 'build/client',
      rollupOptions: {
        output: { format: 'esm' }
      }
    }
  },
  viteServer: {
    build: {
      outDir: 'build/server',
      rollupOptions: {
        output: { format: 'cjs' }
      }
    }
  },
}

const defaultHtmlTemp = '<!DOCTYPE html><html><head>' + 
  '<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0,minimum-scale=1.0,viewport-fit=cover" />' + 
  '<title><!--title--></title><!--ssr-css--><!--custom-head--></head><body><div id="app"><!--ssr-html--></div></body>' + 
  '<script type="module">import { createApp } from "vue";import App from "<!--import-path-->";' + 
  'const app = createApp(App);app.mount("#app")</script></html>'

const shimModuleTemp = 'export async function shimModule(key) {<!--codegen-->}'

export class Vite {
  private _config: ViteConfig
  private _mapping: Record<string, MappingItem> = {}
  private _server: ViteDevServer | undefined
  private _shimModulePath: string

  constructor(config?: ViteConfig) {
    this._config = _.merge(defaultViteConfig, config)
    this._shimModulePath = join([ this.getTempDir(), 'shimModule' ], { posixify: true })
  }

  public checkIsProd() {
    return this._config.env === 'production'
  }

  public getTempDir(): string {
    return this._config.tempDir!
  }

  private genTemp(key: string, source: string): MappingItem {
    const vuePath = relative(this.getTempDir(), source, { posixify: true })
    const htmlTempPath = join([ this.getTempDir(), `${key}.html` ], { posixify: true })
    const importPath = `/${relative(cwd('/'), source, { posixify: true })}`

    let html = defaultHtmlTemp.replace('<!--import-path-->', importPath)
    if(this._config?.customHead) {
      html = html.replace('<!--custom-head-->', this._config.customHead)
    }

    write(htmlTempPath, html, { force: true })
    return { source, htmlTempPath, vuePath }
  }

  public include(key: string, vuePath: string) {
    if (include(this._mapping, key)) return

    if (!exist(vuePath)) throw `Can not found ${vuePath} when include`
    const temp = this.genTemp(key, vuePath)
    this._mapping[key] = temp

    let codegen = ''
    for (const key in this._mapping) {
      codegen += `if (key === '${key}') return import('${this._mapping[key].vuePath}').catch(e => console.log(e))\n`
    }
    write(this._shimModulePath, shimModuleTemp.replace('<!--codegen-->', codegen), { force: true })
  }

  public async build() {
    createDir(this._config.serverDir!)
    createDir(this._config.clientDir!)

    const inputs: string[] = []
    for (const key in this._mapping) {
      inputs.push(this._mapping[key].htmlTempPath)
    }

    const clientConfig = _.merge(this._config.vite, this._config.viteClient)
    clientConfig!.build!.rollupOptions!.input = inputs
    await buildForProduction(clientConfig)

    const serverConfig = _.merge(this._config.vite, this._config.viteServer)
    serverConfig!.build!.rollupOptions!.input = inputs
    serverConfig!.build!.ssr = this._shimModulePath
    await buildForProduction(serverConfig)
  }

  public async render(key: string, ssrData: any): Promise<{ cssHtml: string, ssrHtml: string }> {
    if (!include(this._mapping, key)) {
      throw `Can not found ${key}. Please call "vite.include(${key}, '/path/to/foo.vue')" before render`
    }

    let shimModule
    if (this.checkIsProd()) {
      const prodShimModulePath = join([
        relative(dirname(fileURLToPath(import.meta.url)), this._config!.serverDir!),
        'shimModule.cjs'
      ], { posixify: true })

      // @ts-ignore
      shimModule = (await import(prodShimModulePath)).shimModule
    } else {
      shimModule = (await this._server!.ssrLoadModule(this._shimModulePath)).shimModule
    }

    const vueModule = await shimModule(key)
    const app = createSSRApp(vueModule.default)
    app.provide('ssrData', ssrData)
    const { collect } = setup(app)

    const appHtml = await renderToString(app)
    const cssHtml = collect()
    const ssrDataHtml = `<script>window.ssrData=${JSON.stringify(ssrData)}</script>`
    const ssrHtml = appHtml + ssrDataHtml

    return { cssHtml, ssrHtml }
  }

  public async renderToHtml(key: string, ssrData: any, title = 'TITLE'): Promise<string> {
    const { cssHtml, ssrHtml } = await this.render(key, ssrData)

    let html = ''
    if (this.checkIsProd()) {
      const prodHtmlTempPath = join([ this._config.clientDir!, relative(cwd('/'), this._mapping[key].htmlTempPath) ])
      html = read(prodHtmlTempPath)
    } else {
      html = read(this._mapping[key].htmlTempPath)
      html = await this._server!.transformIndexHtml(key, html)
    }

    return html.replace('<!--ssr-html-->', ssrHtml).replace('<!--ssr-css-->', cssHtml).replace('<!--title-->', title)
  }

  public async getMiddleware(): Promise<Koa.Middleware<object, object>> {
    if (this.checkIsProd()) {
      return async (ctx, next) => {
        const base = this._config.vite?.base || ''
        if (base && ctx.path.startsWith(base)) {
          await send(ctx, join([ this._config.clientDir!, ctx.path.replace(base, '') ]), { immutable: true })
        } else {
          await next()
        }
      }
    } else {
      this._server = await createServer(this._config.vite)
      return connect(this._server.middlewares)
    }
  }
}