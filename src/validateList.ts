import { ApiNames } from './types';

class ValidationError extends Error {
  url: string;
  errors: any[];
  response: any;

  constructor(url: string, errors: any[], response: any) {
    super(`"${url}" sent invalid response`);
    this.url = url;
    this.errors = errors;
    this.response = response;
  }

  log(prepend = '', level = 'error' as 'error' | 'warn') {
    console[level](prepend, `"${this.url}" sent invalid response:\n`, {
      errors: this.errors,
      response: this.response,
    });
  }
}

function validateItem(item: any, model: any) {
  const schema = model.schema;
  const errors = [] as any[];
  Object.entries(schema).forEach(([k, v]) => {
    const value = v as any;
    if (!(k in item)) {
      if (!value.optional) {
        errors.push({ id: item.id, type: 'field_missing', field: k });
      }
    } else if (typeof item[k] !== typeof value.type()) {
      if (value.nullable && item[k] === null) return;
      errors.push({
        id: item.id,
        type: 'type_mismatch',
        field: k,
        expected: typeof value.type(),
        actual: typeof item[k],
      });
    }
  });
  return errors.length ? errors : null;
}

export function validateSingle(
  url: string,
  params: any,
  model: string,
  response: any,
  models: any,
  naming: ApiNames
) {
  const item = response[naming.dataSingle];
  const errors = [] as any[];

  if (!item) {
    errors.push({
      msg: `Response did not include "${naming.dataSingle}" object`,
    });
  }

  const es = validateItem(item, models[model]);
  if (es) errors.push(...es);

  if (errors.length > 0) {
    const e = new ValidationError(url, errors, response);
    e.log('', 'warn');
    throw e;
  }
}

export function validateList(
  url: string,
  params: any,
  model: string,
  response: any,
  models: any,
  naming: ApiNames
) {
  const items = response[naming.data];
  const errors = [] as any[];

  if (!Array.isArray(items)) {
    errors.push({
      msg: `Response did not include "${naming.data}" object`,
    });
  } else {
    items.forEach((item: any) => {
      const es = validateItem(item, models[model]);
      if (es) errors.push(...es);
    });
  }

  if (params.include) {
    if (!response[naming.included]) {
      errors.push({
        msg: `Response did not include "${naming.included}" object`,
      });
    }
  }

  const searchString = params ? new URLSearchParams(params).toString() : '';
  const urlWithSearch = searchString ? url + '?' + searchString : url;

  if (errors.length > 0) {
    const e = new ValidationError(urlWithSearch, errors, response);
    e.log('', 'warn');
    throw e;
  }
}
