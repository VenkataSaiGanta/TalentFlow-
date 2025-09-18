
export async function api(url, opts = {}) {
  const {
    method = 'GET',
    headers: givenHeaders,
    body: givenBody,
    ...rest
  } = opts;

  
  const headers = new Headers(givenHeaders || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  
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
      body = undefined; 
    } else {
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }
  } else if (typeof body === 'string') {
    
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }
 

  const init = { method: upper, headers, body, ...rest };

  let res;
  try {
    res = await fetch(url, init);
   
  } catch (e) {
    
    throw new Error(`Network error: ${e?.message || e}`);
  }

  const ctype = res.headers.get('content-type') || '';
  const isJSON = ctype.includes('application/json');

  let data = null;
  try {
    data = isJSON ? await res.json() : await res.text();
  } catch {
    
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data) ||
      `${res.status} ${res.statusText}`;
      
    throw new Error(msg);
  }

  return data;
}
