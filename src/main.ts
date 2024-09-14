import { Application } from './application.js'

export function main(argv: string[]): Promise<number> {
  const app = new Application()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
  return app.runAsync(argv)
}
