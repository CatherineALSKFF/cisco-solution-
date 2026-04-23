# Cisco Security Vulnerability Policy Requirements

Based on official Cisco PSIRT Security Vulnerability Policy. Vendors must comply with these standards.

## 1. Prohibited Product Behaviors (CRITICAL)

Vendor software and products must NOT contain:
- **Undisclosed device access methods or back doors**
- **Hardcoded or undocumented account credentials**
- **Covert communication channels**
- **Undocumented traffic diversion**

These are considered serious vulnerabilities requiring immediate action.

## 2. Vulnerability Disclosure Requirements

Vendor must:
- Follow **ISO/IEC 29147:2018** guidelines for vulnerability disclosure
- Use **CVSS v3.1** scoring system for vulnerability assessment
- Assign **CVE IDs** to confirmed vulnerabilities
- Classify vulnerabilities by Security Impact Rating (SIR):
  - Critical: CVSS 9.0-10.0
  - High: CVSS 7.0-8.9
  - Medium: CVSS 4.0-6.9
  - Low: Below 4.0

## 3. Incident Response Requirements

Vendor must provide:
- **24/7 security incident contact** (phone and email)
- **Encrypted communication support** (PGP/GPG for sensitive reports)
- **Confidential handling** of vulnerability reports
- **Coordinated disclosure** process with defined timelines
- **Customer notification** within reasonable timeframe

## 4. Security Incident Notification

Vendor must notify Cisco of security incidents:
- **Timeline**: Within 24-72 hours of discovery
- **Content**: Scope, impact, affected products, remediation steps
- **Cooperation**: Work with Cisco's incident response team
- **Confidentiality**: Maintain strict confidentiality until resolution

## 5. Third-Party Component Management

Vendor must:
- Track vulnerabilities in third-party components
- Provide **Software Bill of Materials (SBOM)** on request
- Flag "high-profile" vulnerabilities (CVSS 5.0+, active exploitation)
- Provide **VEX (Vulnerability Exploitability eXchange)** documents

## 6. Cloud/Hosted Services Requirements

If vendor provides cloud or hosted services:
- **Regular patching** of all systems
- **Continuous monitoring** for security issues
- **Direct customer notification** or dashboard alerts
- **Timely patch deployment** to all customer instances

## 7. Security Software Updates

Vendor must provide:
- Security fixes from First Commercial Shipment to Last Day of Support
- **Free updates** for Critical and High severity vulnerabilities
- Clear **End of Support** dates and security fix availability
- Documented **software lifecycle** with security milestones

## 8. Audit and Compliance

Vendor must:
- Maintain **SOC 2 Type II** or equivalent certifications
- Allow security assessments with reasonable notice
- Provide annual security audit reports
- Document compliance with industry standards (ISO 27001, etc.)

## 9. Data Protection

Vendor must:
- Encrypt data at rest and in transit
- Implement access controls and authentication
- Maintain data backup and recovery procedures
- Comply with applicable data protection regulations (GDPR, etc.)
- Protect Cisco customer data at all times

## 10. Secure Development Practices

Vendor must follow secure development lifecycle:
- Security code reviews
- Vulnerability scanning and penetration testing
- Timely patching of critical vulnerabilities
- No intentional security bypasses or weaknesses

---

## Evaluation Criteria

| Status | Criteria |
|--------|----------|
| **Compliant** | All critical requirements present (Sections 1-5), most other requirements met |
| **Needs Review** | Some critical requirements missing or outdated language |
| **Missing** | No meaningful security provisions or critical gaps |
| **Non-Standard** | Terms significantly deviate from Cisco standards |

## Red Flags (Immediate Attention)

- No incident notification requirement
- No vulnerability disclosure process
- Allows hardcoded credentials or backdoors
- No security update commitments
- Missing data protection terms
- No audit rights for Cisco
