'use client'

import { useEffect, useState } from 'react'
import { api, Alert } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    critical: 0,
  })

  useEffect(() => {
    loadAnomalies()
  }, [])

  const loadAnomalies = async () => {
    try {
      setLoading(true)
      const response = await api.alerts({ 
        alert_type: 'anomaly_detection',
        page: 1,
        limit: 100 
      })
      const anomalyAlerts = response.data
      setAnomalies(anomalyAlerts)
      setStats({
        total: anomalyAlerts.length,
        high: anomalyAlerts.filter(a => a.severity === 'high').length,
        critical: anomalyAlerts.filter(a => a.severity === 'critical').length,
      })
    } catch (err) {
      console.error('Error loading anomalies:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Anomaly Detection</h1>
        <p className="text-gray-600 dark:text-gray-400">Detected behavioral anomalies and unusual patterns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Anomalies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">High Severity</p>
                <p className="text-2xl font-bold text-severity-high">{stats.high}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-severity-high" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Critical Severity</p>
                <p className="text-2xl font-bold text-severity-critical">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-severity-critical" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies List */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
          ) : anomalies.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No anomalies detected. The system is monitoring for unusual patterns.
            </div>
          ) : (
            <div className="space-y-4">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly._id}
                  className={`p-6 border rounded-lg ${
                    anomaly.severity === 'critical'
                      ? 'bg-severity-critical/10 border-severity-critical/30'
                      : 'bg-severity-high/10 border-severity-high/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded ${
                          anomaly.severity === 'critical'
                            ? 'bg-severity-critical text-white'
                            : 'bg-severity-high text-white'
                        }`}
                      >
                        {anomaly.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {anomaly.attack_chain?.[0]?.replace(/_/g, ' ').toUpperCase() || 'ANOMALY'}
                      </span>
                      {anomaly.confidence_score && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Confidence: {anomaly.confidence_score}%
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(anomaly.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 dark:text-white mb-4">{anomaly.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Source IP:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-mono">{anomaly.source_ip}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Count:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-semibold">{anomaly.count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">First Seen:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{formatDate(anomaly.first_seen)}</span>
                    </div>
                  </div>

                  {anomaly.tags && anomaly.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {anomaly.tags.map((tag, idx) => (
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

