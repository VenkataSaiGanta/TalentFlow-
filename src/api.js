// src/api.js
export async function api(url, opts = {}) {
  const {
    method = 'GET',
    headers: givenHeaders,
    body: givenBody,
    ...rest
  } = opts;

  // Build headers safely
  const headers = new Headers(givenHeaders || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  // Prepare body
  let body = givenBody;
  const upper = method.toUpperCase();

  const isPlainObject =
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer);

  if (isPlainObject) {
    if (upper === 'GET' || upper === 'HEAD') {
      body = undefined; // browsers reject GET/HEAD with body
    } else {
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }
  } else if (typeof body === 'string') {
    // If caller passed a JSON string, set content-type if not present
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }
  // For FormData/Blob/ArrayBuffer we DON'T set Content-Type—browser will.

  const init = { method: upper, headers, body, ...rest };

  let res;
  try {
    res = await fetch(url, init);
   // alert(res);
  } catch (e) {
    // This is where your error was surfacing—now you get a clear message
    throw new Error(`Network error: ${e?.message || e}`);
  }

  const ctype = res.headers.get('content-type') || '';
  const isJSON = ctype.includes('application/json');

  let data = null;
  try {
    data = isJSON ? await res.json() : await res.text();
  } catch {
    // ignore parse errors; we'll still handle status below
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data) ||
      `${res.status} ${res.statusText}`;
      //msg = res;
     // console.log(err)
    throw new Error(msg);
  }

  return data;
}
