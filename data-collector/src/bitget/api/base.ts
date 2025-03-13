import { ApiClient } from "../../utils/api_client";

// utility function for building api
export function api<T, R>(method: string, endpoint: string) {
  return async (client: ApiClient, params?: T) : Promise<R> => {
    return await client.execute<T, R>(method, endpoint, params);
  };
}