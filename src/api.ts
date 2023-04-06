import ServerError from './ServerError';
import { FetchRequestOptions } from './types';

type ApiParams = { [key: string]: number | string };
type ApiBody = { [key: string]: unknown } | FormData;

type ApiRequest = {
  params?: ApiParams;
  body?: ApiBody;
};

const headers = { 'Content-Type': 'application/json' } as any;
const requestOptions = {} as FetchRequestOptions;

function api(
  method: string,
  url: string,
  { params, body }: ApiRequest,
  extraHeaders = {},
  server: any
) {
  // @ts-expect-error
  const searchString = params ? new URLSearchParams(params).toString() : '';
  const urlWithSearch = searchString ? url + '?' + searchString : url;
  const requestHeaders = { ...headers, ...extraHeaders };

  let payload: ApiBody | string | undefined = body;

  if (payload instanceof FormData) {
    requestHeaders['Content-Type'] = 'multipart/form-data';
  }
  if (requestHeaders['Content-Type'] === 'application/json' && payload) {
    payload = JSON.stringify(payload);
  }

  if (server) {
    return server.handleRequest(method, urlWithSearch, payload, requestHeaders);
  }

  return fetch(urlWithSearch, {
    ...requestOptions,
    method,
    headers: requestHeaders,
    body: payload as any,
  }).then((res) => {
    if (res.ok) {
      const json = res.json();
      if (json instanceof Promise) {
        return json
          .then((data) => data)
          .catch(() => {
            // Getting the JSON failed, return empty object
            return {};
          });
      }
      return json;
    } else {
      throw new ServerError(res.status, res);
    }
  });
}

export default function createApi(server: any) {
  return {
    headers,
    requestOptions,
    get(url: string, params?: ApiParams, extraHeaders?: any) {
      return api('GET', url, { params }, extraHeaders, server);
    },
    post(url: string, body?: ApiBody, params?: ApiParams, extraHeaders?: any) {
      return api('POST', url, { body, params }, extraHeaders, server);
    },
    patch(url: string, body?: ApiBody, params?: ApiParams, extraHeaders?: any) {
      return api('PATCH', url, { body, params }, extraHeaders, server);
    },
    delete(
      url: string,
      body?: ApiBody,
      params?: ApiParams,
      extraHeaders?: any
    ) {
      return api('DELETE', url, { body, params }, extraHeaders, server);
    },
  };
}
