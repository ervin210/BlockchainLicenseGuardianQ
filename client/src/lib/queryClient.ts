import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Helper function to make API requests
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url API endpoint URL
 * @param body Request body (for POST, PUT, etc.)
 * @returns Promise with the response
 */
export async function apiRequest(
  method: string, 
  url: string, 
  body?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

/**
 * Default query function for React Query
 */
export const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  // The first element in the queryKey should be the URL
  const url = queryKey[0];
  
  // Check if there are any parameters to add to the URL
  const params = queryKey.slice(1).reduce((acc, param, index) => {
    if (index % 2 === 0 && queryKey[index + 2]) {
      return { ...acc, [param]: queryKey[index + 2] };
    }
    return acc;
  }, {});
  
  // Build the URL with query parameters if needed
  const fullUrl = Object.keys(params).length > 0
    ? `${url}?${new URLSearchParams(params as any).toString()}`
    : url;
  
  const response = await apiRequest('GET', fullUrl);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred while fetching data');
  }
  
  return response.json();
};

export default queryClient;