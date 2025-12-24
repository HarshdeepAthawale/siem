const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Event {
  _id?: string;
  timestamp: string;
  source_ip: string;
  destination_ip?: string;
  username?: string;
  event_type: string;
  service: string;
  status: 'success' | 'failure' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  raw_log: string;
  ingestion_time: string;
}

export interface Alert {
  _id?: string;
  alert_type: string;
  source_ip: string;
  severity: 'high' | 'critical';
  count: number;
  first_seen: string;
  last_seen: string;
  description: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Metrics {
  totals: {
    events: number;
    alerts: number;
    criticalAlerts: number;
    uniqueIPs: number;
  };
  eventsOverTime: Array<{
    time: string;
    count: number;
  }>;
  severityBreakdown: Record<string, number>;
  topIPs: Array<{
    ip: string;
    count: number;
  }>;
  statusRatio: Record<string, number>;
}

export interface LogsQueryParams {
  ip?: string;
  severity?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AlertsQueryParams {
  severity?: string;
  ip?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  health: () => fetchAPI<{ status: string; timestamp: string; mongodb: string }>('/health'),

  logs: (params?: LogsQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    return fetchAPI<PaginatedResponse<Event>>(`/logs?${searchParams.toString()}`);
  },

  alerts: (params?: AlertsQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    return fetchAPI<PaginatedResponse<Alert>>(`/alerts?${searchParams.toString()}`);
  },

  metrics: (params?: { from?: string; to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    return fetchAPI<Metrics>(`/metrics?${searchParams.toString()}`);
  },
};

