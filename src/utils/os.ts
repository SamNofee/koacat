import { namedCapturing } from './string'
import { execaCommand, execaCommandSync, Options } from 'execa'

export function killPID(pid: number) {
  if (process.platform === 'win32') {
    execaCommandSync(`taskkill /f /pid ${pid}`)
  } else {
    execaCommandSync(`kill -9 ${pid}`)
  }
}

export function killTCP(port: number) {
  if (process.platform === 'win32') {
    const netstat = execaCommandSync('netstat -ano')
    namedCapturing<'pid'>(
      netstat.stdout,
      new RegExp(`:${port} +.*? +LISTENING +(?<pid>\\d+)`, 'g'),
      (data) => {
        killPID(parseInt(data.pid))
      }
    )
  } else {
    const lsof = execaCommandSync('lsof -i -P')
    namedCapturing<'pid'>(
      lsof.stdout,
      new RegExp(`\\S+ +(?<pid>\\d+) +.*?TCP \\*\\:${port}`, 'g'),
      (data) => {
        killPID(parseInt(data.pid))
      }
    )
  }
}

export function runDetached(command: string, filepath: string, options?: Options) {
  const res = execaCommand(command, {
    detached: true,
    stdio: 'ignore',
    ...options,
  })
  res.unref()
}

export function run(command: string, options?: Options) {
  const res = execaCommand(command, options)
  res.stdout!.pipe(process.stdout)
  res.stderr!.pipe(process.stderr)
}

export function runSync(command: string) {
  execaCommandSync(command)
}