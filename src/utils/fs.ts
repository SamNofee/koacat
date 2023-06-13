import fs from 'fs'
import {
  relative as pathrelative,
  join as pathjoin,
  dirname as pathdirname
} from 'path'
import _ from 'lodash'

export function src(aliaspath: string): string {
  return join([process.cwd(), 'src', _.trimStart(aliaspath, '/')], { posixify: true })
}

export function cwd(aliaspath: string): string {
  return join([process.cwd(), _.trimStart(aliaspath, '/')], { posixify: true })
}

export function read(filepath: string): string {
  return fs.readFileSync(filepath, 'utf-8').replace(/\r\n/g, '\n')
}

export function write(filepath: string, content: string, options?: {
  force?: boolean
}) {
  options?.force && createDir(dirname(filepath))
  return fs.writeFileSync(filepath, content, 'utf-8')
}

export function createDir(dirpath: string) {
  fs.mkdirSync(dirpath, { recursive: true })
}

export function readDir(dirpath: string, options?: {
  recursive?: boolean,
  withDir?: boolean
}): string[] {
  if (options?.recursive) {
    const res: string[] = []
    const paths = readDir(dirpath)
    paths.forEach(x => {
      const path = join([dirpath, x])
      if (isDir(path)) {
        options?.withDir && res.push(`${x}/`)
        res.push(...readDir(path, { recursive: true }).map(y => `${x}/${y}`))
        return
      }
      res.push(x)
    })
    return res
  }

  return fs.readdirSync(dirpath)
}

export function dirname(path: string): string {
  return pathdirname(path)
}

export function exist(path: string): boolean {
  return fs.existsSync(path)
}

export function remove(path: string) {
  fs.rmSync(path, { recursive: true, force: true })
}

export function copy(source: string, dest: string) {
  fs.cpSync(source, dest, { recursive: true, force: true })
}

export function rename(source: string, dest: string) {
  fs.renameSync(source, dest)
}

export function isDir(path: string): boolean {
  return fs.statSync(path).isDirectory()
}

export function isFile(path: string): boolean {
  return fs.statSync(path).isFile()
}

export function relative(from: string, to: string, options?: {
  posixify?: boolean
}): string {
  return options?.posixify ? posixify(pathrelative(from, to)) : pathrelative(from, to)
}

export function join(paths: string[], options?: {
  posixify?: boolean
}): string {
  return options?.posixify ? posixify(pathjoin(...paths)) : pathjoin(...paths)
}

export function posixify(path: string): string {
  return path.replace(/\\+/g, '/')
}
