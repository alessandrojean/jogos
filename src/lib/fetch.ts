import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import Soup from 'gi://Soup'

interface FetchOptions {
  url: string
  query?: Record<string, string>
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string | object
}

Gio._promisify(Soup.Session.prototype, 'send_async', 'send_finish')
Gio._promisify(Gio.MemoryOutputStream.prototype, 'splice_async', 'splice_finish')

export default async function fetch<T>(options: FetchOptions) {
  const session = new Soup.Session()
  const method = options.method ?? 'GET'

  const uriBase = GLib.Uri.parse(options.url, GLib.UriFlags.NONE)

  let query = uriBase.get_query()

  if (options.query) {
    const newQuery = Object.entries(options.query)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    query = newQuery.length > 0 ? newQuery : null
  }

  const uri = GLib.Uri.build(
    GLib.UriFlags.NONE,
    uriBase.get_scheme(),
    uriBase.get_userinfo(),
    uriBase.get_host(),
    uriBase.get_port(),
    uriBase.get_path(),
    query,
    uriBase.get_fragment(),
  )

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
    const body = new TextEncoder().encode(options.body)
    message.set_request_body_from_bytes(null, new GLib.Bytes(body))
  } else if (options.body !== undefined) {
    const body = new TextEncoder().encode(JSON.stringify(options.body))
    message.set_request_body_from_bytes(null, new GLib.Bytes(body))
  }

  print(`Fetching ${uri.to_string()}`)

  // TODO: Remove the Promise cast when ts-for-gir fixes this.
  // https://github.com/gjsify/ts-for-gir/issues/171
  const inputStream = await (session.send_async(message, GLib.PRIORITY_DEFAULT, null) as unknown as Promise<Gio.InputStream>)

  const { statusCode, reasonPhrase } = message
  const ok = statusCode >= 200 && statusCode < 300

  return {
    status: statusCode,
    statusText: reasonPhrase,
    ok,
    type: 'basic',
    async json() {
      const text = await this.text()
      return JSON.parse(text) as T
    },
    async text() {
      const gBytes = await this.gBytes()
      return new TextDecoder().decode(gBytes.toArray())
    },
    async arrayBuffer() {
      const gBytes = await this.gBytes()
      return gBytes.toArray().buffer
    },
    async gBytes() {
      const outputStream = Gio.MemoryOutputStream.new_resizable()

      // TODO: Remove the Promise cast when ts-for-gir fixes this.
      // https://github.com/gjsify/ts-for-gir/issues/171
      await (outputStream.splice_async(
        inputStream!,
        Gio.OutputStreamSpliceFlags.CLOSE_TARGET | Gio.OutputStreamSpliceFlags.CLOSE_SOURCE,
        GLib.PRIORITY_DEFAULT,
        null,
      ) as unknown as Promise<number>)

      const bytes = outputStream.steal_as_bytes()
      return bytes
    },
  }

}
