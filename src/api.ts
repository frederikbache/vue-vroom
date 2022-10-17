import ServerError from "./ServerError";

type ApiParams = { [key: string]: number | string };
type ApiBody = { [key: string]: unknown };

type ApiRequest = {
    params?: ApiParams,
    body?: ApiBody
}

const headers = new Headers();

function api(method: string, url: string, { params, body }: ApiRequest) {
    // @ts-expect-error
    const searchString = params ? (new URLSearchParams(params)).toString() : '';
    const urlWithSearch = searchString ? url + '?' + searchString : url;
    return fetch(urlWithSearch, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    }).then(res => {
        if (res.ok) {
            return res.json();
        } else {
            throw new ServerError(res.status, res.json());
        }
    })
}

export default {
    headers,
    get(url: string, params?: ApiParams) {
        return api('GET', url, { params });
    },
    post(url: string, body?: ApiBody, params?: ApiParams) {
        return api('POST', url, { body, params });
    },
    patch(url: string, body?: ApiBody, params?: ApiParams) {
        return api('PATCH', url, { body, params });
    },
    delete(url: string, params?: ApiParams) {
        return api('DELETE', url, { params });
    },
}