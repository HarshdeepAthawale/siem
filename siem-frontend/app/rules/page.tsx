'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Settings, Shield, CheckCircle, XCircle } from 'lucide-react'

interface DetectionRule {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: 'high' | 'critical'
  threshold?: string
  window?: string
}

const detectionRules: DetectionRule[] = [
  {
    id: 'ssh_brute_force',
    name: 'SSH Brute Force',
    description: 'Detects multiple failed SSH login attempts from the same IP',
    enabled: true,
    severity: 'high',
    threshold: '5 attempts',
    window: '2 minutes',
  },
  {
    id: 'rdp_brute_force',
    name: 'RDP Brute Force',
    description: 'Detects multiple failed RDP login attempts (Event ID 4625, Logon Type 10)',
    enabled: true,
    severity: 'high',
    threshold: '5 attempts',
    window: '2 minutes',
  },
  {
    id: 'privilege_escalation',
    name: 'Privilege Escalation',
    description: 'Detects admin logon (Event ID 4672) and explicit credentials (Event ID 4648)',
    enabled: true,
    severity: 'critical',
    window: '5 minutes',
  },
  {
    id: 'malware_detection',
    name: 'Malware Detection',
    description: 'Detects suspicious process patterns, PowerShell encoded commands, and temp directory execution',
    enabled: true,
    severity: 'critical',
    threshold: '3 occurrences',
  },
  {
    id: 'lateral_movement',
    name: 'Lateral Movement',
    description: 'Detects explicit credentials across hosts, RDP connections, and SMB access patterns',
    enabled: true,
    severity: 'critical',
    window: '10 minutes',
    threshold: '3 hosts',
  },
  {
    id: 'data_exfiltration',
    name: 'Data Exfiltration',
    description: 'Detects large file transfers, unusual data access patterns, and after-hours access',
    enabled: true,
    severity: 'high',
    window: '5 minutes',
  },
  {
    id: 'anomaly_detection',
    name: 'Anomaly Detection',
    description: 'Detects unusual logon times, locations, and process execution patterns using statistical analysis',
    enabled: true,
    severity: 'high',
    threshold: '2.5 std deviations',
  },
  {
    id: 'correlation_engine',
    name: 'Correlation Engine',
    description: 'Correlates multiple events to detect attack chains and multi-stage attacks',
    enabled: true,
    severity: 'critical',
    window: '15 minutes',
  },
  {
    id: 'compliance',
    name: 'Compliance Monitoring',
    description: 'Tracks failed authentications, admin usage, and account lockouts for compliance',
    enabled: true,
    severity: 'high',
    threshold: '10 failed attempts',
  },
]

export default function RulesPage() {
  const [rules, setRules] = useState<DetectionRule[]>(detectionRules)

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
    )
  }

  const enabledCount = rules.filter((r) => r.enabled).length

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Detection Rules</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and configure security detection rules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{rules.length}</p>
              </div>
              <Settings className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Enabled</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{enabledCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Disabled</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {rules.length - enabledCount}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-6 border rounded-lg ${
                  rule.enabled
                    ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                    : 'bg-gray-100 dark:bg-gray-950 border-gray-300 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield
                        className={`w-5 h-5 ${
                          rule.severity === 'critical'
                            ? 'text-severity-critical'
                            : 'text-severity-high'
                        }`}
                      />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          rule.severity === 'critical'
                            ? 'bg-severity-critical/20 text-severity-critical'
                            : 'bg-severity-high/20 text-severity-high'
                        }`}
                      >
                        {rule.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{rule.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {rule.threshold && (
                        <span>
                          <strong>Threshold:</strong> {rule.threshold}
                        </span>
                      )}
                      {rule.window && (
                        <span>
                          <strong>Time Window:</strong> {rule.window}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                      rule.enabled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

