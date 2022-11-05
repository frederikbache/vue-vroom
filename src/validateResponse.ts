import { ApiNames } from './types';
import { validateList, validateSingle } from './validateList';

export default function createValidator(models: any, naming: ApiNames) {
  return {
    list(url: string, params: any, model: string, response: any) {
      if (__DEV__) {
        validateList(url, params, model, response, models, naming);
      }
    },
    single(url: string, params: any, model: string, response: any) {
      if (__DEV__) {
        validateSingle(url, params, model, response, models, naming);
      }
    },
  };
}
