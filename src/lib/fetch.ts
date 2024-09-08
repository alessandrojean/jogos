import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import Soup from 'gi://Soup'

interface FetchOptions {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string | object
}

export default async function fetch(options: FetchOptions) {
  const session = new Soup.Session()
  const method = options.method ?? 'GET'

  const uri = GLib.Uri.parse(options.url, GLib.UriFlags.NONE)

  const message = new Soup.Message({
    method,
    uri,
  })

  const headers = options.headers ?? {}

  const requestHeaders = message.get_request_headers()
  for (const header in headers) {
    requestHeaders.append(header, headers[header])
  }

  if (typeof options.body === 'string') {
    // @ts-expect-error
    const body = new TextEncoder().encode(options.body)
    message.set_request_body_from_bytes(null, new GLib.Bytes(body))
  } else if (options.body !== undefined) {
    // @ts-expect-error
    const body = new TextEncoder().encode(JSON.stringify(options.body))
    message.set_request_body_from_bytes(null, new GLib.Bytes(body))
  }

  print(`Fetching ${options.url}`)

  const inputStream = await promiseTask(
    session,
    "send_async",
    "send_finish",
    message,
    GLib.PRIORITY_DEFAULT,
    null,
  )

  const { statusCode, reasonPhrase } = message
  const ok = statusCode >= 200 && statusCode < 300

  return {
    status: statusCode,
    statusText: reasonPhrase,
    ok,
    type: 'basic',
    async json() {
      const text = await this.text()
      return JSON.parse(text)
    },
    async text() {
      const gBytes = await this.gBytes()
      // @ts-expect-error
      return new TextDecoder().decode(gBytes.toArray())
    },
    async arrayBuffer() {
      const gBytes = await this.gBytes()
      return gBytes.toArray().buffer
    },
    async gBytes() {
      const outputStream = Gio.MemoryOutputStream.new_resizable()

      await promiseTask(
        outputStream,
        "splice_async",
        "splice_finish",
        inputStream,
        Gio.OutputStreamSpliceFlags.CLOSE_TARGET |
          Gio.OutputStreamSpliceFlags.CLOSE_SOURCE,
        GLib.PRIORITY_DEFAULT,
        null,
      )

      const bytes = outputStream.steal_as_bytes()
      return bytes
    },
  }

}

type FunctionKeys<T extends object> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

function promiseTask<
  T extends object,
  M extends FunctionKeys<T>,
  F extends FunctionKeys<T>
>(
  object: T,
  method: M,
  finish: F,
  ...args: T[M] extends (...args: infer P) => any ? P : never
): Promise<T[F] extends (...args: any[]) => infer R ? R : never> {
  return new Promise((resolve, reject) => {
    // @ts-expect-error
    object[method](...args, (self, asyncResult) => {
      try {
        // @ts-expect-error
        resolve(object[finish](asyncResult));
      } catch (err) {
        reject(err);
      }
    });
  });
}
