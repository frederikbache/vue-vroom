export function useServerRequest(vroom: any) {
  return {
    post: (url: string, body?: object) =>
      vroom.server?.parseRequest(
        { method: 'POST', url, body: JSON.stringify(body), headers: {} },
        ''
      ),
    patch: (url: string, body: object) =>
      vroom.server?.parseRequest(
        { method: 'PATCH', url, body: JSON.stringify(body), headers: {} },
        ''
      ),
    get: (url: string) =>
      vroom.server?.parseRequest({ method: 'GET', url, headers: {} }, ''),
    delete: (url: string) =>
      vroom.server?.parseRequest({ method: 'DELETE', url, headers: {} }, ''),
  };
}
