const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

class MockHeaders {
  constructor(init = {}) {
    this.map = new Map();
    if (init instanceof MockHeaders) {
      for (const [key, value] of init.entries()) {
        this.set(key, value);
      }
      return;
    }
    if (Array.isArray(init)) {
      init.forEach(([key, value]) => this.set(key, value));
      return;
    }
    Object.entries(init).forEach(([key, value]) => this.set(key, value));
  }

  normalize(name) {
    return String(name).toLowerCase();
  }

  get(name) {
    const key = this.normalize(name);
    const value = this.map.get(key);
    if (Array.isArray(value)) {
      return value[value.length - 1] || null;
    }
    return value ?? null;
  }

  set(name, value) {
    const key = this.normalize(name);
    if (key === 'set-cookie') {
      this.map.set(key, Array.isArray(value) ? value : [String(value)]);
      return;
    }
    this.map.set(key, String(value));
  }

  append(name, value) {
    const key = this.normalize(name);
    if (key === 'set-cookie') {
      const existing = this.map.get(key);
      const cookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
      cookies.push(String(value));
      this.map.set(key, cookies);
      return;
    }
    const existing = this.get(key);
    this.map.set(key, existing ? `${existing}, ${value}` : String(value));
  }

  delete(name) {
    this.map.delete(this.normalize(name));
  }

  has(name) {
    return this.map.has(this.normalize(name));
  }

  entries() {
    return this.map.entries();
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  getSetCookie() {
    const value = this.map.get('set-cookie');
    return Array.isArray(value) ? value : value ? [value] : [];
  }
}

class MockResponse {
  constructor(body = null, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers =
      init.headers instanceof MockHeaders ? init.headers : new MockHeaders(init.headers || {});
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body ?? '');
  }

  static json(body, init = {}) {
    const headers = new MockHeaders(init.headers || {});
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return new MockResponse(JSON.stringify(body), { ...init, headers });
  }
}

class MockRequest {
  constructor(url = '', options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers =
      options.headers instanceof MockHeaders ? options.headers : new MockHeaders(options.headers || {});
    this._body = options.body ?? null;
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body ?? {};
  }

  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body ?? '');
  }
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class MockReadableStream {};
}

global.Headers = MockHeaders;
global.Response = MockResponse;
global.Request = MockRequest;
global.fetch = jest.fn();
