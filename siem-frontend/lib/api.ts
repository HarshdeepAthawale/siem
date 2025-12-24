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
  correlated_events?: string[];
  attack_chain?: string[];
  confidence_score?: number;
  false_positive?: boolean;
  acknowledged?: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  assigned_to?: string;
  tags?: string[];
  notes?: string;
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
  acknowledged?: string;
  false_positive?: string;
  assigned_to?: string;
  tags?: string;
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

  // Alert triage operations
  getAlert: (id: string) => fetchAPI<Alert & { correlated_events_data?: Event[] }>(`/alerts/${id}`),
  
  acknowledgeAlert: (id: string, acknowledged_by?: string) =>
    fetchAPI<Alert>(`/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ acknowledged_by }),
    }),
  
  assignAlert: (id: string, assigned_to: string) =>
    fetchAPI<Alert>(`/alerts/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_to }),
    }),
  
  markFalsePositive: (id: string, false_positive: boolean) =>
    fetchAPI<Alert>(`/alerts/${id}/false-positive`, {
      method: 'PATCH',
      body: JSON.stringify({ false_positive }),
    }),
  
  updateAlertNotes: (id: string, notes: string) =>
    fetchAPI<Alert>(`/alerts/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),
};

