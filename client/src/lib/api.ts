// The single place the client talks to the backend. Everything that used to be repeated at each
// call site — the /api prefix, the bearer header, the response.ok check, JSON parsing — lives here.
// Failures arrive as ApiError, so callers can branch on the status instead of on a bare Error.

const BASE = '/api'

export class ApiError extends Error {
  readonly status: number
  // The `message` the backend sent, when it sent one. Kept separate from Error.message so callers
  // can tell a real server explanation apart from our placeholder.
  readonly serverMessage: string | undefined

  constructor(status: number, serverMessage?: string) {
    super(serverMessage ?? `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.serverMessage = serverMessage
  }
}

// Prefers the server's own message ("Invalid credentials") and falls back to ours when the
// response carried none — which is what every form in the app wants to show.
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.serverMessage ? error.serverMessage : fallback
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: Method
  body?: unknown
  token?: string
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // A 204 (DELETE) and most error responses carry no JSON body, so a parse failure here is
  // expected rather than exceptional — the status is what decides success.
  const data = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw new ApiError(response.status, (data as { message?: string } | undefined)?.message)
  }
  return data as T
}

// A 401 normally means the session died and the app should sign out. One endpoint breaks that rule:
// the server answers a wrong *current password* with 401 too (AuthService.updatePassword), and
// mistyping it must not log you out. Those calls opt out with `signOutOn401: false`.
export type CallOptions = { signOutOn401?: boolean }

export type ApiClient = {
  get: <T>(path: string, options?: CallOptions) => Promise<T>
  post: <T>(path: string, body?: unknown, options?: CallOptions) => Promise<T>
  put: <T>(path: string, body?: unknown, options?: CallOptions) => Promise<T>
  patch: <T>(path: string, body?: unknown, options?: CallOptions) => Promise<T>
  del: <T = void>(path: string, options?: CallOptions) => Promise<T>
}

// Binds the current session to every request. `getToken` is read per call (not captured once) so
// the client identity stays stable across re-renders even as the token is refreshed.
export function createApiClient(config: { getToken: () => string; onUnauthorized: () => void }): ApiClient {
  const call = async <T>(path: string, method: Method, body?: unknown, options: CallOptions = {}): Promise<T> => {
    const token = config.getToken()
    try {
      return await request<T>(path, { method, body, token })
    } catch (error) {
      // A token can expire during any call, not just the one at boot, so the session is torn down
      // here rather than at each call site. A 401 with no token is a rejected login, not an expired
      // session, so it is left for the form to report.
      const expired = error instanceof ApiError && error.status === 401 && token
      if (expired && options.signOutOn401 !== false) config.onUnauthorized()
      throw error
    }
  }

  return {
    get: (path, options) => call(path, 'GET', undefined, options),
    post: (path, body, options) => call(path, 'POST', body, options),
    put: (path, body, options) => call(path, 'PUT', body, options),
    patch: (path, body, options) => call(path, 'PATCH', body, options),
    del: (path, options) => call(path, 'DELETE', undefined, options),
  }
}
