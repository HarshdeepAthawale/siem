import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/siem',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
  },
  detection: {
    // SSH Brute Force
    sshBruteForceThreshold: parseInt(process.env.SSH_BRUTE_FORCE_THRESHOLD || '5', 10),
    sshBruteForceWindowMinutes: parseInt(process.env.SSH_BRUTE_FORCE_WINDOW_MINUTES || '2', 10),
    sshBruteForceEnabled: process.env.SSH_BRUTE_FORCE_ENABLED !== 'false',

    // RDP Brute Force
    rdpBruteForceThreshold: parseInt(process.env.RDP_BRUTE_FORCE_THRESHOLD || '5', 10),
    rdpBruteForceWindowMinutes: parseInt(process.env.RDP_BRUTE_FORCE_WINDOW_MINUTES || '2', 10),
    rdpBruteForceEnabled: process.env.RDP_BRUTE_FORCE_ENABLED !== 'false',

    // Privilege Escalation
    privilegeEscalationEnabled: process.env.PRIVILEGE_ESCALATION_ENABLED !== 'false',
    privilegeEscalationWindowMinutes: parseInt(process.env.PRIVILEGE_ESCALATION_WINDOW_MINUTES || '5', 10),

    // Malware Detection
    malwareDetectionEnabled: process.env.MALWARE_DETECTION_ENABLED !== 'false',
    suspiciousProcessThreshold: parseInt(process.env.SUSPICIOUS_PROCESS_THRESHOLD || '3', 10),

    // Lateral Movement
    lateralMovementEnabled: process.env.LATERAL_MOVEMENT_ENABLED !== 'false',
    lateralMovementWindowMinutes: parseInt(process.env.LATERAL_MOVEMENT_WINDOW_MINUTES || '10', 10),
    lateralMovementHostThreshold: parseInt(process.env.LATERAL_MOVEMENT_HOST_THRESHOLD || '3', 10),

    // Data Exfiltration
    dataExfiltrationEnabled: process.env.DATA_EXFILTRATION_ENABLED !== 'false',
    dataExfiltrationSizeThreshold: parseInt(process.env.DATA_EXFILTRATION_SIZE_THRESHOLD || '104857600', 10), // 100MB
    dataExfiltrationWindowMinutes: parseInt(process.env.DATA_EXFILTRATION_WINDOW_MINUTES || '5', 10),

    // Anomaly Detection
    anomalyDetectionEnabled: process.env.ANOMALY_DETECTION_ENABLED !== 'false',
    anomalyBaselineDays: parseInt(process.env.ANOMALY_BASELINE_DAYS || '7', 10),
    anomalyThreshold: parseFloat(process.env.ANOMALY_THRESHOLD || '2.5', 10), // Standard deviations

    // Correlation Engine
    correlationEnabled: process.env.CORRELATION_ENABLED !== 'false',
    correlationWindowMinutes: parseInt(process.env.CORRELATION_WINDOW_MINUTES || '15', 10),

    // Compliance
    complianceEnabled: process.env.COMPLIANCE_ENABLED !== 'false',
    complianceFailedAuthThreshold: parseInt(process.env.COMPLIANCE_FAILED_AUTH_THRESHOLD || '10', 10),
  },
};

