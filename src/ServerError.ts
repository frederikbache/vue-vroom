export default class ServerError extends Error {
  status: number;
  data: object;

  constructor(status: number, data?: object) {
    super();
    this.status = status;
    this.data = data || {};
  }
}
