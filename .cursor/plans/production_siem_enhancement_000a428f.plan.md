---
name: Production SIEM Enhancement
overview: Transform the SIEM platform from demo to production-ready with Windows Event Log support and comprehensive detection capabilities including brute force, privilege escalation, malware, lateral movement, data exfiltration, anomaly detection, correlation rules, and compliance monitoring.
todos:
  - id: windows-event-model
    content: Enhance Event model with Windows Event Log fields (event_id, logon_type, process_name, command_line, etc.) and add appropriate indexes
    status: completed
  - id: windows-parser
    content: Create Windows Event Log parser supporting Event IDs 4624, 4625, 4672, 4648, 4688, 5145, 4657 with XML and CSV format support
    status: completed
    dependencies:
      - windows-event-model
  - id: windows-collector
    content: Create Windows Event Log collector supporting file-based collection (.evtx, XML, CSV) and WMI queries
    status: completed
  - id: update-multiparser
    content: Update MultiParser to include Windows Event Log parser in the parsing chain
    status: completed
    dependencies:
      - windows-parser
  - id: rdp-brute-force
    content: Implement RDP brute force detector for Windows Event ID 4625 (Logon Type 10)
    status: completed
    dependencies:
      - windows-parser
  - id: privilege-escalation
    content: Implement privilege escalation detector for Event IDs 4672, 4648 with UAC bypass detection
    status: completed
    dependencies:
      - windows-parser
  - id: malware-detector
    content: Implement malware detector with suspicious process patterns, temp directory execution, unsigned executables, and PowerShell encoded commands
    status: completed
    dependencies:
      - windows-parser
  - id: lateral-movement
    content: Implement lateral movement detector tracking Event ID 4648 across hosts, SMB access, and RDP connections
    status: completed
    dependencies:
      - windows-parser
  - id: data-exfiltration
    content: Implement data exfiltration detector monitoring Event ID 5145, large file transfers, and unusual data access patterns
    status: completed
    dependencies:
      - windows-parser
  - id: anomaly-detector
    content: Implement anomaly detection engine with baseline learning, statistical analysis, and ML-ready architecture
    status: completed
    dependencies:
      - windows-parser
  - id: correlation-engine
    content: Implement correlation engine for multi-event attack chain detection with state machine and time-window correlation
    status: completed
    dependencies:
      - rdp-brute-force
      - privilege-escalation
      - lateral-movement
  - id: compliance-detector
    content: Implement compliance detector tracking failed authentications, admin usage, and policy violations
    status: completed
    dependencies:
      - windows-parser
  - id: enhanced-alert-model
    content: Enhance Alert model with correlated_events, attack_chain, confidence_score, false_positive, acknowledged, assigned_to, and tags fields
    status: completed
  - id: update-detection-engine
    content: Update DetectionEngine to include all new detectors with priority ordering, enable/disable config, and parallel execution
    status: completed
    dependencies:
      - rdp-brute-force
      - privilege-escalation
      - malware-detector
      - lateral-movement
      - data-exfiltration
      - anomaly-detector
      - correlation-engine
      - compliance-detector
  - id: update-normalizer
    content: Update normalizer to handle Windows Event Log normalization, Event ID mapping, and severity calculation
    status: completed
    dependencies:
      - windows-parser
  - id: alert-api-enhancements
    content: Add API endpoints for alert acknowledgment, assignment, false positive marking, and correlation view
    status: completed
    dependencies:
      - enhanced-alert-model
  - id: alert-triage-ui
    content: Enhance alerts page with acknowledge, assign, false positive buttons, alert details modal, and attack chain visualization
    status: completed
    dependencies:
      - alert-api-enhancements
  - id: rules-management-ui
    content: Create rules management page for viewing, enabling/disabling, and configuring detection rules
    status: completed
    dependencies:
      - update-detection-engine
  - id: anomaly-dashboard
    content: Create anomaly dashboard page showing detected anomalies, baseline comparisons, and severity visualizations
    status: completed
    dependencies:
      - anomaly-detector
  - id: detection-config
    content: Add comprehensive detection configuration to config/index.js with thresholds, time windows, and rule definitions
    status: completed
---

# Production

SIEM Enhancement Plan

## Overview

Transform the current demo SIEM into a production-ready security platform with Windows Event Log support and comprehensive threat detection capabilities.

## Architecture Changes

### 1. Enhanced Event Model

**File**: `siem-backend/src/database/models/Event.js`

- Add Windows Event Log fields:
- `event_id` (Windows Event ID: 4624, 4625, 4672, etc.)
- `logon_type` (Interactive, Network, Service, etc.)
- `process_name` (executable name)
- `command_line` (process command line)
- `target_username` (for logon events)
- `privilege_list` (for privilege escalation)
- `file_path` (for file access events)
- `registry_key` (for registry modifications)
- Add indexes for Windows-specific queries:
- `{ event_id: 1, timestamp: -1 }`
- `{ username: 1, timestamp: -1 }`
- `{ process_name: 1, timestamp: -1 }`

### 2. Windows Event Log Parser

**File**: `siem-backend/src/parsers/windowsEventParser.js` (NEW)Parse Windows Event Log formats:

- Security events (Event IDs: 4624, 4625, 4672, 4648, 4768, 4769)
- System events (process creation, service starts)
- Application events (malware indicators)
- XML format parsing for Windows Event Log exports
- CSV format parsing for PowerShell exports

Key event types to parse:

- **4624**: Successful logon
- **4625**: Failed logon
- **4672**: Admin logon (privilege escalation indicator)
- **4648**: Explicit credentials used (lateral movement)
- **4688**: Process creation (malware detection)
- **5145**: Network share access (data exfiltration)
- **4657**: Registry value modification

### 3. Enhanced Multi-Parser

**File**: `siem-backend/src/parsers/multiParser.js`

- Add Windows Event Log parser to the parser chain
- Implement parser priority (Windows events first, then SSH, then HTTP)
- Add parser metadata tracking

### 4. Detection Rules Implementation

#### A. RDP Brute Force Detector

**File**: `siem-backend/src/detectors/rdpBruteForceDetector.js` (NEW)

- Detect Windows Event ID 4625 (failed logon) with Logon Type 10 (RDP)
- Same aggregation pattern as SSH brute force
- Configurable threshold (default: 5 attempts in 2 minutes)

#### B. Privilege Escalation Detector

**File**: `siem-backend/src/detectors/privilegeEscalationDetector.js` (NEW)

- Detect Event ID 4672 (admin logon) from non-admin accounts
- Detect Event ID 4648 (explicit credentials) with high privileges
- Detect UAC bypass attempts
- Alert on privilege changes within short time windows

#### C. Malware Detection Detector

**File**: `siem-backend/src/detectors/malwareDetector.js` (NEW)

- Detect suspicious process names (common malware patterns)
- Detect process execution from temp directories
- Detect unsigned executables
- Detect PowerShell execution with encoded commands
- Detect process injection patterns
- Use threat intelligence patterns (configurable list)

#### D. Lateral Movement Detector

**File**: `siem-backend/src/detectors/lateralMovementDetector.js` (NEW)

- Detect Event ID 4648 (explicit credentials) across different hosts
- Detect SMB/network share access from unusual IPs
- Detect RDP connections to multiple hosts
- Correlate logon events across systems
- Track user movement patterns

#### E. Data Exfiltration Detector

**File**: `siem-backend/src/detectors/dataExfiltrationDetector.js` (NEW)

- Detect large file transfers (Event ID 5145 - network share access)
- Detect unusual data access patterns
- Detect external connections with large data volumes
- Monitor network share access to sensitive directories
- Track file access outside business hours

#### F. Anomaly Detection Engine

**File**: `siem-backend/src/detectors/anomalyDetector.js` (NEW)

- Baseline normal behavior (user logon patterns, process execution)
- Detect statistical anomalies:
- Unusual logon times
- Unusual logon locations
- Unusual process execution
- Unusual network connections
- Use moving averages and standard deviations
- Machine learning-ready architecture (for future ML integration)

#### G. Correlation Engine

**File**: `siem-backend/src/detectors/correlationEngine.js` (NEW)

- Multi-event correlation rules:
- Failed logon → Successful logon → Privilege escalation
- Multiple failed logons → Successful logon → Lateral movement
- Process creation → Network connection → Data transfer
- Time-window based correlation (configurable windows)
- State machine for tracking attack chains
- Store correlation state in MongoDB

#### H. Compliance Detector

**File**: `siem-backend/src/detectors/complianceDetector.js` (NEW)

- Track failed authentication attempts (compliance requirement)
- Monitor admin account usage
- Track policy violations:
- Password policy violations
- Account lockout events
- Unauthorized access attempts
- Generate compliance reports

### 5. Enhanced Detection Engine

**File**: `siem-backend/src/detectors/detectionEngine.js`

- Add all new detectors to the engine
- Implement detector priority/ordering
- Add detector enable/disable configuration
- Add detector performance metrics
- Implement parallel detection execution
- Add detector dependency management

### 6. Detection Configuration

**File**: `siem-backend/src/config/index.js`Add configuration for all detectors:

- Thresholds for each detector
- Time windows
- Enable/disable flags
- Anomaly detection baselines
- Correlation rule definitions

### 7. Enhanced Alert Model

**File**: `siem-backend/src/database/models/Alert.js`

- Add fields:
- `correlated_events` (array of event IDs)
- `attack_chain` (array of attack stages)
- `confidence_score` (0-100)
- `false_positive` (boolean flag)
- `acknowledged` (boolean, for triage)
- `assigned_to` (analyst username)
- `tags` (array of strings)
- Add indexes for triage workflow

### 8. Windows Event Log Collector

**File**: `siem-backend/src/collectors/windowsEventCollector.js` (NEW)

- Support multiple collection methods:
- File-based (reading .evtx or exported XML/CSV)
- WMI queries (for live Windows systems)
- Windows Event Forwarding (WEF) support
- Handle Windows Event Log rotation
- Parse different Windows Event Log formats

### 9. Enhanced Normalizer

**File**: `siem-backend/src/normalizer/index.js`

- Add Windows Event Log normalization logic
- Map Windows Event IDs to event types
- Extract and normalize Windows-specific fields
- Calculate severity based on event type and context

### 10. API Enhancements

**File**: `siem-backend/src/api/routes/alerts.js`

- Add alert acknowledgment endpoint
- Add alert assignment endpoint
- Add false positive marking
- Add alert filtering by tags
- Add alert correlation view

### 11. Frontend Enhancements

#### Alert Triage Interface

**File**: `siem-frontend/app/alerts/page.tsx`

- Add acknowledge button
- Add assign functionality
- Add false positive marking
- Add alert details modal with correlated events
- Add attack chain visualization

#### Detection Rules Management

**File**: `siem-frontend/app/rules/page.tsx` (NEW)

- View all detection rules
- Enable/disable rules
- Configure thresholds
- View rule performance metrics

#### Anomaly Dashboard

**File**: `siem-frontend/app/anomalies/page.tsx` (NEW)

- Display detected anomalies
- Show baseline vs current behavior
- Anomaly severity visualization

## Implementation Order

1. **Phase 1: Windows Event Log Support**

- Windows Event Log parser
- Enhanced Event model
- Windows Event Log collector
- Update normalizer

2. **Phase 2: Core Detection Rules**

- RDP brute force detector
- Privilege escalation detector
- Malware detector
- Update detection engine

3. **Phase 3: Advanced Detection**

- Lateral movement detector
- Data exfiltration detector
- Compliance detector

4. **Phase 4: Intelligence Layer**

- Anomaly detection engine
- Correlation engine
- Enhanced alert model

5. **Phase 5: Frontend & Operations**

- Alert triage interface
- Detection rules management
- Anomaly dashboard

## Data Flow

```javascript
Windows Event Logs → Windows Collector → Windows Parser → Normalizer → MongoDB
                                                              ↓
                                                         Detection Engine
                                                              ↓
                    ┌─────────────────────────────────────────┼─────────────────────────┐
                    ↓                                         ↓                         ↓
            Brute Force Detector              Privilege Escalation          Malware Detector
                    ↓                                         ↓                         ↓
            Lateral Movement Detector          Data Exfiltration            Anomaly Detector
                    ↓                                         ↓                         ↓
                    └─────────────────────────────────────────┼─────────────────────────┘
                                                              ↓
                                                      Correlation Engine
                                                              ↓
                                                          MongoDB (Alerts)
                                                              ↓
                                                          Frontend API
```



## Testing Strategy

- Create Windows Event Log sample files for testing
- Unit tests for each parser
- Unit tests for each detector