export async function wait(delay = 0) {
  await new Promise((r) => setTimeout(r, delay));
}
