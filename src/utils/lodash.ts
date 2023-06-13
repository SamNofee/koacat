import _ from 'lodash'

export function template(template: string, data: Record<string, string>) {
  return (_.template(template))(data)
}

export function include(source: any, target: any): boolean {
  if(source?.indexOf !== undefined) {
    return source.indexOf(target) !== -1
  } else if(source?.hasOwnProperty !== undefined) {
    return source.hasOwnProperty(target)
  } else {
    return false
  }
}

export function forceSlice(arr, start: number, end: number) {
  return _.slice(arr, start < 0 ? 0 : start, end)
}

export function namedCapturing<Groups extends string>(
  content: string,
  regexp: RegExp,
  fn: (data: Record<Groups, string>) => string | void
): string {
  return content.replace(regexp, (...args) => {
    const res = fn(args[args.length - 1])
    return res || ''
  })
}