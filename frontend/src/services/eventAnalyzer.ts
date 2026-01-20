import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface EventAnalysis {
  event_name: string;
  date: string;
  time: string;
  description: string;
  location: string;
  confidence: 'high' | 'medium' | 'low';
  extracted_text?: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis: EventAnalysis;
  metadata: {
    analyzed_at: string;
    model: string;
    tokens_used: number;
  };
  error?: string;
  message?: string;
}

/**
 * Analyze an event image using the Event Analyzer API
 * @param imageUri - Base64 encoded image or URL
 * @param title - Optional title/context for the image
 * @returns Promise with event analysis data
 */
export async function analyzeEventImage(
  imageUri: string,
  title?: string
): Promise<EventAnalysis> {
  try {
    console.log('[EventAnalyzer] Analyzing image...');

    const response = await axios.post<AnalysisResponse>(
      `${API_URL}/api/events/analyze-image`,
      {
        image: imageUri,
        title: title || 'Evento'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds for image analysis
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Analysis failed');
    }

    console.log('[EventAnalyzer] Analysis completed:', response.data.analysis);

    return response.data.analysis;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[EventAnalyzer] API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to analyze image'
      );
    }

    console.error('[EventAnalyzer] Unexpected error:', error);
    throw error;
  }
}

/**
 * Check if the Event Analyzer API is healthy
 * @returns Promise with health status
 */
export async function checkHealthStatus(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_URL}/api/health`, {
      timeout: 5000
    });

    return response.data.status === 'healthy' &&
           response.data.mongodb === 'connected' &&
           response.data.openai === 'configured';
  } catch (error) {
    console.error('[EventAnalyzer] Health check failed:', error);
    return false;
  }
}
