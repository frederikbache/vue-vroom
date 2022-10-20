export function useServerRequest(vroom: any) {
  return {
    post: (url: string, body?: object) =>
      vroom.server?.parseRequest(
        { method: 'POST', url, body: JSON.stringify(body) },
        ''
      ),
    patch: (url: string, body: object) =>
      vroom.server?.parseRequest(
        { method: 'PATCH', url, body: JSON.stringify(body) },
        ''
      ),
    get: (url: string) =>
      vroom.server?.parseRequest({ method: 'GET', url }, ''),
    delete: (url: string) =>
      vroom.server?.parseRequest({ method: 'DELETE', url }, ''),
  };
}
