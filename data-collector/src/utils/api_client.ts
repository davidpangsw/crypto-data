import logger from "./logger";

export class ApiClient {
  public baseUrl: string;

  constructor(baseUrl: string = "https://api.bitget.com") {
    this.baseUrl = baseUrl;
  }

  async execute<T, R>(method: string, endpoint: string, params?: T): Promise<R> {
    let url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const options: RequestInit = { method, headers, };

    if (params && Object.keys(params).length > 0) {
      if (method === 'GET') {
        const queryString = new URLSearchParams(params).toString();
        url = `${url}?${queryString}`;
      } else {
        options.body = JSON.stringify(params);
      }
    }

    // logger.debug("fetching...", { url, options, });

    const response = await fetch(url, options);
    if (!response.ok) {
      // logger.error(`API error! response: ${response.status} ${JSON.stringify(response)}`);
      throw new Error(`API error! response: ${response.status} ${await response.text()}`);
    }
    const obj = await response.json();
    const { code, msg, requestTime, data } = obj;
    if (code == "00000") {
      // success
      return data;
    } else {
      logger.warn("API error", obj);
      return data;
    }
  }
}


