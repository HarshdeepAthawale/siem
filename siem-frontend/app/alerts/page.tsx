'use client'

import { useEffect, useState } from 'react'
import { api, Alert, AlertsQueryParams } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })
  
  const [filters, setFilters] = useState<AlertsQueryParams>({
    page: 1,
    limit: 50,
  })

  useEffect(() => {
    loadAlerts()
  }, [filters])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const response = await api.alerts(filters)
      setAlerts(response.data)
      setPagination(response.pagination)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
      console.error('Error loading alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof AlertsQueryParams, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Security Alerts</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and triage security alerts</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Severity</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Source IP</label>
              <input
                type="text"
                placeholder="192.168.1.1"
                value={filters.ip || ''}
                onChange={(e) => handleFilterChange('ip', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">From Date</label>
              <input
                type="datetime-local"
                value={filters.from || ''}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts ({pagination.total.toLocaleString()})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">No alerts found</div>
          ) : (
            <>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-6 border rounded-lg ${
                      alert.severity === 'critical'
                        ? 'bg-severity-critical/10 border-severity-critical/30'
                        : 'bg-severity-high/10 border-severity-high/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded ${
                            alert.severity === 'critical'
                              ? 'bg-severity-critical text-white'
                              : 'bg-severity-high text-white'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(alert.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 dark:text-white mb-4">{alert.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Source IP:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-mono">{alert.source_ip}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Count:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-semibold">{alert.count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">First Seen:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{formatDate(alert.first_seen)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Seen:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{formatDate(alert.last_seen)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} alerts
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="p-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

