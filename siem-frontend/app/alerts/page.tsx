'use client'

import { useEffect, useState } from 'react'
import { api, Alert, AlertsQueryParams, Event } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserPlus, FileText, X, Eye } from 'lucide-react'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [correlatedEvents, setCorrelatedEvents] = useState<Event[]>([])
  const [showModal, setShowModal] = useState(false)
  const [assignTo, setAssignTo] = useState('')
  const [notes, setNotes] = useState('')
  
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

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId, 'current_user')
      loadAlerts()
    } catch (err) {
      console.error('Error acknowledging alert:', err)
    }
  }

  const handleAssign = async (alertId: string) => {
    if (!assignTo.trim()) return
    try {
      await api.assignAlert(alertId, assignTo)
      setAssignTo('')
      loadAlerts()
      setShowModal(false)
    } catch (err) {
      console.error('Error assigning alert:', err)
    }
  }

  const handleFalsePositive = async (alertId: string, isFalsePositive: boolean) => {
    try {
      await api.markFalsePositive(alertId, isFalsePositive)
      loadAlerts()
    } catch (err) {
      console.error('Error marking false positive:', err)
    }
  }

  const handleViewDetails = async (alert: Alert) => {
    setSelectedAlert(alert)
    setShowModal(true)
    setAssignTo(alert.assigned_to || '')
    setNotes(alert.notes || '')
    
    if (alert._id) {
      try {
        const alertDetails = await api.getAlert(alert._id)
        if (alertDetails.correlated_events_data) {
          setCorrelatedEvents(alertDetails.correlated_events_data)
        }
      } catch (err) {
        console.error('Error loading alert details:', err)
      }
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedAlert?._id) return
    try {
      await api.updateAlertNotes(selectedAlert._id, notes)
      loadAlerts()
    } catch (err) {
      console.error('Error saving notes:', err)
    }
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Status</label>
              <select
                value={filters.acknowledged || ''}
                onChange={(e) => handleFilterChange('acknowledged', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All</option>
                <option value="false">Unacknowledged</option>
                <option value="true">Acknowledged</option>
              </select>
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
                    } ${alert.acknowledged ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
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
                        {alert.acknowledged && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded">
                            Acknowledged
                          </span>
                        )}
                        {alert.false_positive && (
                          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded">
                            False Positive
                          </span>
                        )}
                        {alert.confidence_score && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Confidence: {alert.confidence_score}%
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(alert.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 dark:text-white mb-4">{alert.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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

                    {alert.attack_chain && alert.attack_chain.length > 0 && (
                      <div className="mb-4">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Attack Chain: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {alert.attack_chain.map((stage, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-accent/20 text-accent rounded border border-accent/30"
                            >
                              {stage.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.tags && alert.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {alert.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => alert._id && handleAcknowledge(alert._id)}
                          className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Acknowledge
                        </button>
                      )}
                      {!alert.false_positive && (
                        <button
                          onClick={() => alert._id && handleFalsePositive(alert._id, true)}
                          className="px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Mark False Positive
                        </button>
                      )}
                      {alert.false_positive && (
                        <button
                          onClick={() => alert._id && handleFalsePositive(alert._id, false)}
                          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Unmark False Positive
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(alert)}
                        className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
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

      {/* Alert Details Modal */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alert Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Assign To</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      placeholder="Analyst username"
                      className="flex-1 px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => selectedAlert._id && handleAssign(selectedAlert._id)}
                      className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Current Assignment</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedAlert.assigned_to || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  rows={4}
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Add notes about this alert..."
                />
              </div>

              {selectedAlert.attack_chain && selectedAlert.attack_chain.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Attack Chain</h3>
                  <div className="flex items-center gap-2">
                    {selectedAlert.attack_chain.map((stage, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-accent/20 text-accent rounded border border-accent/30">
                          {stage.replace(/_/g, ' ')}
                        </span>
                        {idx < selectedAlert.attack_chain!.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {correlatedEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Correlated Events ({correlatedEvents.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {correlatedEvents.map((event) => (
                      <div
                        key={event._id}
                        className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-900 dark:text-white font-mono">{event.source_ip}</span>
                          <span className="text-gray-600 dark:text-gray-400">{formatDate(event.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{event.event_type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
