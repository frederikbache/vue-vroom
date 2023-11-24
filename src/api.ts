import ServerError from './ServerError';
import { FetchRequestOptions } from './types';

type ApiParams = { [key: string]: number | string };
type ApiBody = { [key: string]: unknown } | FormData | Array<any>;

type ApiRequest = {
  params?: ApiParams;
  body?: ApiBody;
};

const headers = { 'Content-Type': 'application/json' } as any;
const requestOptions = {} as FetchRequestOptions;
const intercept = {
  error: null as ((e: ServerError) => void) | null,
};

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
    if (server) {
      requestHeaders['Content-Type'] = 'multipart/form-data';
    } else {
      delete requestHeaders['Content-Type'];
    }
  } else if (requestHeaders['Content-Type'] === 'application/json' && payload) {
    payload = JSON.stringify(payload);
  }

  if (server) {
    return server
      .handleRequest(method, urlWithSearch, payload, requestHeaders)
      .catch((e: unknown) => {
        if (intercept.error) intercept.error(e as ServerError);
        throw e;
      });
  }

  return fetch(urlWithSearch, {
    ...requestOptions,
    method,
    headers: requestHeaders,
    body: payload as any,
  })
    .then(async (res) => {
      let returnBody = {};
      try {
        // Try and parse the response json
        returnBody = await res.json();
      } catch {}
      if (res.ok) {
        // If okay return the response
        return returnBody;
      } else {
        // If not, throw an error
        throw new ServerError(res.status, returnBody);
      }
    })
    .catch((e) => {
      if (e instanceof ServerError) {
        if (intercept.error) intercept.error(e);
      }
      throw e;
    });
}

export default function createApi(server: any) {
  return {
    intercept,
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
