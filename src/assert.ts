class AssertError extends Error {
  constructor(msg: string) {
    super(msg);
  }

  log(prepend = '') {
    console.error(prepend, this.message);
  }
}

export default function assert(condition: boolean, msg: string) {
  if (!condition) {
    // console.error('Vroom error: ' + msg);
    throw new AssertError('Vroom error: ' + msg);
  }
}
