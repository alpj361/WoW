/**
 * Backend API Service
 * Connects React Native app to PHP backend
 */

// IMPORTANT: Update this URL based on your environment
// For local testing: http://localhost:8000 or http://YOUR_IP:8000
// For production: https://your-domain.com
const API_BASE_URL = 'https://mapshub.onrender.com';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  cached?: boolean;
  error?: string;
  message?: string;
}

/**
 * Fetch places from backend (Google Maps via Outscraper)
 */
export const fetchPlaces = async (params: {
  query?: string;
  location?: string;
  category?: string;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.query) queryParams.append('query', params.query);
  if (params.location) queryParams.append('location', params.location);
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/api/places?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data: ApiResponse<any[]> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch places');
    }
    
    return {
      places: data.data || [],
      cached: data.cached || false,
    };
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
};

/**
 * Fetch events from backend (Exa Search)
 */
export const fetchEvents = async (params: {
  location?: string;
  category?: string;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.location) queryParams.append('location', params.location);
  if (params.category) queryParams.append('category', params.category);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/api/events?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data: ApiResponse<any[]> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch events');
    }
    
    return {
      events: data.data || [],
      cached: data.cached || false,
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Fetch Guatemala.com data (Supadata)
 */
export const fetchGuatemalaData = async (params: {
  type: 'events' | 'news' | 'places';
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  queryParams.append('type', params.type);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE_URL}/api/guatemala?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data: ApiResponse<any[]> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch Guatemala data');
    }
    
    return {
      data: data.data || [],
      cached: data.cached || false,
    };
  } catch (error) {
    console.error('Error fetching Guatemala data:', error);
    throw error;
  }
};

/**
 * Check backend health
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking backend health:', error);
    return null;
  }
};

/**
 * Get API base URL (useful for debugging)
 */
export const getApiUrl = () => API_BASE_URL;
