import { PrismaClient, Domain, Difficulty } from '@prisma/client'

const prisma = new PrismaClient()

// CISSP Domain mapping
const domainMap: Record<number, Domain> = {
  1: Domain.SECURITY_RISK_MANAGEMENT,
  2: Domain.ASSET_SECURITY,
  3: Domain.SECURITY_ARCHITECTURE,
  4: Domain.COMMUNICATION_NETWORK_SECURITY,
  5: Domain.IDENTITY_ACCESS_MANAGEMENT,
  6: Domain.SECURITY_ASSESSMENT,
  7: Domain.SECURITY_OPERATIONS,
  8: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
}

// Sample Questions - 50+ questions covering all 8 domains
const questions = [
  // Domain 1: Security and Risk Management
  {
    questionText: "Which of the following is the FIRST canon of the (ISC)² Code of Ethics?",
    options: [
      "Act honorably, honestly, justly, responsibly, and legally",
      "Protect society, the common good, necessary public trust and confidence, and the infrastructure",
      "Provide diligent and competent service to principals",
      "Advance and protect the profession"
    ],
    correctAnswer: 1,
    explanation: "The first canon of the (ISC)² Code of Ethics is to protect society, the common good, necessary public trust and confidence, and the infrastructure. This canon emphasizes putting the common good ahead of yourself.",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["ethics", "isc2", "code-of-ethics"]
  },
  {
    questionText: "What are the five pillars of information security?",
    options: [
      "Prevention, Detection, Response, Recovery, and Correction",
      "Confidentiality, Integrity, Availability, Authenticity, and Nonrepudiation",
      "Identification, Authentication, Authorization, Auditing, and Accountability",
      "Planning, Implementation, Monitoring, Review, and Improvement"
    ],
    correctAnswer: 1,
    explanation: "The five pillars of information security are Confidentiality, Integrity, Availability (CIA triad), plus Authenticity and Nonrepudiation. These form the foundation of information security principles.",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["cia-triad", "security-principles", "fundamentals"]
  },
  {
    questionText: "Which type of security plan is typically useful for 5 years and defines the organization's security purpose?",
    options: [
      "Operational Plan",
      "Tactical Plan",
      "Strategic Plan",
      "Business Continuity Plan"
    ],
    correctAnswer: 2,
    explanation: "A Strategic Plan is a long-term plan useful for 5 years that defines the organization's security purpose. It should include a risk assessment and align with business objectives.",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["security-planning", "governance", "management"]
  },
  {
    questionText: "What is the primary purpose of due care in information security?",
    options: [
      "To establish legal liability",
      "To ensure reasonable steps are taken to protect assets",
      "To transfer risk to a third party",
      "To eliminate all security risks"
    ],
    correctAnswer: 1,
    explanation: "Due care refers to the reasonable steps taken to protect assets and ensure security. It demonstrates that an organization has acted responsibly in implementing security measures.",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["due-care", "legal", "risk-management"]
  },
  {
    questionText: "Which risk handling strategy involves transferring the potential impact of a risk to a third party?",
    options: [
      "Risk Mitigation",
      "Risk Acceptance",
      "Risk Avoidance",
      "Risk Transference"
    ],
    correctAnswer: 3,
    explanation: "Risk Transference involves shifting the potential impact of a risk to a third party, typically through insurance or contracts. This doesn't eliminate the risk but transfers the financial burden.",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["risk-handling", "risk-management", "insurance"]
  },
  {
    questionText: "What is the formula for calculating Annualized Loss Expectancy (ALE)?",
    options: [
      "ALE = Asset Value × Exposure Factor",
      "ALE = Single Loss Expectancy × Annualized Rate of Occurrence",
      "ALE = Risk × Probability × Impact",
      "ALE = Total Loss / Number of Incidents"
    ],
    correctAnswer: 1,
    explanation: "ALE = Single Loss Expectancy (SLE) × Annualized Rate of Occurrence (ARO). This helps organizations understand the expected annual financial impact of a risk.",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["risk-assessment", "ale", "quantitative-analysis"]
  },
  {
    questionText: "Which of the following BEST describes qualitative risk assessment?",
    options: [
      "Uses numerical values and monetary figures",
      "Relies on subjective judgment and ranking scales",
      "Calculates precise ROI for security investments",
      "Requires extensive historical data"
    ],
    correctAnswer: 1,
    explanation: "Qualitative risk assessment uses subjective judgment, ranking scales (high/medium/low), and scenario-based analysis rather than numerical values. It's useful when quantitative data is unavailable.",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["risk-assessment", "qualitative", "methodology"]
  },

  // Domain 2: Asset Security
  {
    questionText: "What is the PRIMARY purpose of data classification?",
    options: [
      "To reduce storage costs",
      "To ensure appropriate protection based on sensitivity",
      "To simplify data backup procedures",
      "To comply with retention policies"
    ],
    correctAnswer: 1,
    explanation: "Data classification ensures that data receives appropriate protection based on its sensitivity and business value. This enables organizations to allocate security resources effectively.",
    domain: Domain.ASSET_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["data-classification", "information-lifecycle", "protection"]
  },
  {
    questionText: "Which data role is responsible for the overall protection of data and determining who can access it?",
    options: [
      "Data Custodian",
      "Data Owner",
      "Data User",
      "Data Steward"
    ],
    correctAnswer: 1,
    explanation: "The Data Owner is responsible for the overall protection of data assets and determining access rights. They make decisions about classification and acceptable use.",
    domain: Domain.ASSET_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["data-roles", "data-owner", "responsibilities"]
  },
  {
    questionText: "What is the PRIMARY concern when disposing of storage media containing sensitive data?",
    options: [
      "Speed of disposal",
      "Cost of disposal method",
      "Ensuring data is unrecoverable",
      "Maintaining an audit trail"
    ],
    correctAnswer: 2,
    explanation: "The primary concern when disposing of storage media is ensuring that sensitive data cannot be recovered. This may require physical destruction, degaussing, or secure wiping procedures.",
    domain: Domain.ASSET_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["data-disposal", "media-sanitization", "destruction"]
  },
  {
    questionText: "Which of the following represents the correct order of data remanence destruction effectiveness from least to most effective?",
    options: [
      "Degaussing, Clearing, Purging, Destruction",
      "Clearing, Purging, Degaussing, Destruction",
      "Purging, Clearing, Degaussing, Destruction",
      "Clearing, Degaussing, Purging, Destruction"
    ],
    correctAnswer: 1,
    explanation: "From least to most effective: Clearing (overwriting), Purging (including degaussing), and Destruction (physical destruction) provides the highest level of assurance.",
    domain: Domain.ASSET_SECURITY,
    difficulty: Difficulty.HARD,
    tags: ["data-remanence", "sanitization", "destruction"]
  },
  {
    questionText: "What is the PRIMARY purpose of data retention policies?",
    options: [
      "To maximize storage utilization",
      "To ensure data is kept for required periods and properly disposed of",
      "To encrypt all stored data",
      "To classify data by sensitivity"
    ],
    correctAnswer: 1,
    explanation: "Data retention policies define how long data must be kept based on legal, regulatory, and business requirements, and how it should be properly disposed of when no longer needed.",
    domain: Domain.ASSET_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["retention", "compliance", "data-lifecycle"]
  },

  // Domain 3: Security Architecture and Engineering
  {
    questionText: "Which security model is based on the concept of subjects, objects, and access modes, and uses a matrix to define permissions?",
    options: [
      "Bell-LaPadula Model",
      "Biba Model",
      "Clark-Wilson Model",
      "Harrison-Ruzzo-Ullman Model"
    ],
    correctAnswer: 0,
    explanation: "The Bell-LaPadula Model uses a matrix-based approach with subjects, objects, and access modes. It focuses on confidentiality with rules: No Read Up, No Write Down.",
    domain: Domain.SECURITY_ARCHITECTURE,
    difficulty: Difficulty.HARD,
    tags: ["security-models", "bell-lapadula", "confidentiality"]
  },
  {
    questionText: "What is the PRIMARY security concern with the Biba model?",
    options: [
      "Confidentiality",
      "Integrity",
      "Availability",
      "Authentication"
    ],
    correctAnswer: 1,
    explanation: "The Biba model focuses on integrity, preventing unauthorized modification of data. It uses rules: No Read Down, No Write Up to maintain data integrity levels.",
    domain: Domain.SECURITY_ARCHITECTURE,
    difficulty: Difficulty.MEDIUM,
    tags: ["security-models", "biba", "integrity"]
  },
  {
    questionText: "Which type of cryptographic system uses the same key for both encryption and decryption?",
    options: [
      "Asymmetric cryptography",
      "Symmetric cryptography",
      "Public key infrastructure",
      "Hash functions"
    ],
    correctAnswer: 1,
    explanation: "Symmetric cryptography uses the same key for both encryption and decryption. Examples include AES, DES, and 3DES. It's faster than asymmetric but requires secure key distribution.",
    domain: Domain.SECURITY_ARCHITECTURE,
    difficulty: Difficulty.EASY,
    tags: ["cryptography", "symmetric", "encryption"]
  },
  {
    questionText: "What is the PRIMARY advantage of using a hardware security module (HSM)?",
    options: [
      "Lower cost than software solutions",
      "Tamper-resistant key storage and cryptographic operations",
      "Faster network connectivity",
      "Easier integration with cloud services"
    ],
    correctAnswer: 1,
    explanation: "HSMs provide tamper-resistant hardware for storing cryptographic keys and performing cryptographic operations, offering higher security than software-based solutions.",
    domain: Domain.SECURITY_ARCHITECTURE,
    difficulty: Difficulty.MEDIUM,
    tags: ["hsm", "key-management", "cryptography"]
  },
  {
    questionText: "In the OSI model, which layer is responsible for encryption and decryption?",
    options: [
      "Transport Layer",
      "Network Layer",
      "Presentation Layer",
      "Session Layer"
    ],
    correctAnswer: 2,
    explanation: "The Presentation Layer (Layer 6) is responsible for data translation, encryption, decryption, and compression. It ensures data is in a usable format for the application layer.",
    domain: Domain.SECURITY_ARCHITECTURE,
    difficulty: Difficulty.MEDIUM,
    tags: ["osi-model", "encryption", "layers"]
  },
  {
    questionText: "What type of trust model does X.509 certificate infrastructure use?",
    options: [
      "Web of Trust",
      "Hierarchical Trust",
      "Peer-to-Peer Trust",
      "Mesh Trust"
    ],
    correctAnswer: 1,
    explanation: "X.509 uses a hierarchical trust model with Certificate Authorities (CAs) at different levels. Root CAs certify intermediate CAs, which certify end entities.",
    domain: Domain.SECURITY_ARCHITECTURE,
    difficulty: Difficulty.MEDIUM,
    tags: ["pki", "x509", "certificates"]
  },

  // Domain 4: Communication and Network Security
  {
    questionText: "Which protocol provides secure remote access to a network over an unsecured network?",
    options: [
      "HTTP",
      "FTP",
      "VPN",
      "SNMP"
    ],
    correctAnswer: 2,
    explanation: "Virtual Private Network (VPN) creates a secure, encrypted tunnel over an unsecured network, allowing secure remote access to organizational resources.",
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["vpn", "remote-access", "tunneling"]
  },
  {
    questionText: "What is the PRIMARY function of a firewall?",
    options: [
      "Encrypting network traffic",
      "Filtering network traffic based on security rules",
      "Assigning IP addresses",
      "Resolving domain names"
    ],
    correctAnswer: 1,
    explanation: "A firewall's primary function is to filter network traffic based on predetermined security rules, controlling traffic flow between network segments.",
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["firewall", "network-security", "filtering"]
  },
  {
    questionText: "Which protocol operates at the Network layer and provides authentication and encryption for IP packets?",
    options: [
      "TLS",
      "SSL",
      "IPsec",
      "SSH"
    ],
    correctAnswer: 2,
    explanation: "IPsec (Internet Protocol Security) operates at the Network layer (Layer 3) and provides authentication, integrity, and encryption for IP packets.",
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    difficulty: Difficulty.MEDIUM,
    tags: ["ipsec", "vpn", "network-security"]
  },
  {
    questionText: "What is the purpose of a DMZ in network architecture?",
    options: [
      "To store backup data",
      "To host public-facing services with limited internal network access",
      "To encrypt all internal traffic",
      "To monitor employee activity"
    ],
    correctAnswer: 1,
    explanation: "A DMZ (Demilitarized Zone) is a network segment that hosts public-facing services while providing a buffer zone with limited access to the internal network.",
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    difficulty: Difficulty.MEDIUM,
    tags: ["dmz", "network-architecture", "segmentation"]
  },
  {
    questionText: "Which TCP/IP layer corresponds to the OSI Transport layer?",
    options: [
      "Network Interface Layer",
      "Internet Layer",
      "Transport Layer",
      "Application Layer"
    ],
    correctAnswer: 2,
    explanation: "The TCP/IP Transport layer corresponds to the OSI Transport layer, providing end-to-end communication services including TCP and UDP protocols.",
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    difficulty: Difficulty.MEDIUM,
    tags: ["tcp-ip", "osi", "layers"]
  },
  {
    questionText: "What type of attack involves an attacker intercepting and potentially modifying communications between two parties?",
    options: [
      "Denial of Service",
      "Man-in-the-Middle",
      "Phishing",
      "SQL Injection"
    ],
    correctAnswer: 1,
    explanation: "A Man-in-the-Middle (MITM) attack occurs when an attacker intercepts communications between two parties, potentially reading or modifying the data without detection.",
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["mitm", "attacks", "network-security"]
  },

  // Domain 5: Identity and Access Management
  {
    questionText: "What are the three factors of authentication?",
    options: [
      "Username, password, and PIN",
      "Something you know, something you have, and something you are",
      "Encryption, hashing, and tokenization",
      "Identification, authentication, and authorization"
    ],
    correctAnswer: 1,
    explanation: "The three factors of authentication are: Something you know (password), Something you have (token), and Something you are (biometric). Multi-factor authentication uses two or more.",
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["authentication", "mfa", "factors"]
  },
  {
    questionText: "Which access control model assigns permissions based on the user's role within an organization?",
    options: [
      "Discretionary Access Control (DAC)",
      "Mandatory Access Control (MAC)",
      "Role-Based Access Control (RBAC)",
      "Rule-Based Access Control"
    ],
    correctAnswer: 2,
    explanation: "Role-Based Access Control (RBAC) assigns permissions based on the user's role in the organization, simplifying administration and ensuring consistent access for similar job functions.",
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["access-control", "rbac", "authorization"]
  },
  {
    questionText: "What is the PRIMARY purpose of Single Sign-On (SSO)?",
    options: [
      "To increase password complexity",
      "To allow users to authenticate once and access multiple systems",
      "To prevent password reuse",
      "To enforce multi-factor authentication"
    ],
    correctAnswer: 1,
    explanation: "SSO allows users to authenticate once and gain access to multiple systems without re-authenticating, improving user experience while maintaining security.",
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["sso", "authentication", "federation"]
  },
  {
    questionText: "Which protocol is used for authentication in a Windows domain environment?",
    options: [
      "RADIUS",
      "TACACS+",
      "Kerberos",
      "SAML"
    ],
    correctAnswer: 2,
    explanation: "Kerberos is the default authentication protocol in Windows domains. It uses tickets and symmetric key cryptography to provide secure authentication.",
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["kerberos", "authentication", "windows"]
  },
  {
    questionText: "What is the difference between identification and authentication?",
    options: [
      "There is no difference",
      "Identification is claiming an identity; authentication is proving it",
      "Authentication happens before identification",
      "Identification requires biometrics"
    ],
    correctAnswer: 1,
    explanation: "Identification is the act of claiming an identity (e.g., entering a username), while authentication is proving that identity (e.g., entering a password or providing biometrics).",
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["identification", "authentication", "iam"]
  },
  {
    questionText: "In Mandatory Access Control (MAC), what determines access permissions?",
    options: [
      "The data owner",
      "Operating system security labels",
      "The user's discretion",
      "Network administrator settings"
    ],
    correctAnswer: 1,
    explanation: "In MAC, access permissions are determined by security labels assigned by the operating system, not by users or owners. This model is used in high-security environments.",
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["mac", "access-control", "security-labels"]
  },

  // Domain 6: Security Assessment and Testing
  {
    questionText: "What is the PRIMARY purpose of a vulnerability assessment?",
    options: [
      "To exploit security weaknesses",
      "To identify and prioritize security vulnerabilities",
      "To test incident response procedures",
      "To audit user access rights"
    ],
    correctAnswer: 1,
    explanation: "A vulnerability assessment identifies and prioritizes security vulnerabilities in systems and applications, helping organizations understand their security posture.",
    domain: Domain.SECURITY_ASSESSMENT,
    difficulty: Difficulty.EASY,
    tags: ["vulnerability-assessment", "scanning", "security-testing"]
  },
  {
    questionText: "What is the MAIN difference between a vulnerability scan and a penetration test?",
    options: [
      "Vulnerability scans are more expensive",
      "Penetration tests attempt to exploit vulnerabilities",
      "Vulnerability scans require more expertise",
      "Penetration tests are automated"
    ],
    correctAnswer: 1,
    explanation: "Penetration tests go beyond identifying vulnerabilities by attempting to actually exploit them, demonstrating real-world impact and validating findings.",
    domain: Domain.SECURITY_ASSESSMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["penetration-testing", "vulnerability-scan", "security-testing"]
  },
  {
    questionText: "Which type of penetration test provides no prior knowledge of the target to the tester?",
    options: [
      "White box testing",
      "Gray box testing",
      "Black box testing",
      "Crystal box testing"
    ],
    correctAnswer: 2,
    explanation: "Black box testing provides no prior knowledge of the target, simulating an external attacker with no inside information about the organization's systems.",
    domain: Domain.SECURITY_ASSESSMENT,
    difficulty: Difficulty.EASY,
    tags: ["penetration-testing", "black-box", "testing-methodology"]
  },
  {
    questionText: "What is the PRIMARY purpose of an internal audit?",
    options: [
      "To comply with external regulations",
      "To verify security controls and processes are functioning correctly",
      "To test external attack scenarios",
      "To certify security compliance"
    ],
    correctAnswer: 1,
    explanation: "Internal audits verify that security controls and processes are functioning as intended, identifying gaps and areas for improvement within the organization.",
    domain: Domain.SECURITY_ASSESSMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["audit", "internal-audit", "compliance"]
  },
  {
    questionText: "Which security testing method uses simulated attacks to test incident response capabilities?",
    options: [
      "Vulnerability scanning",
      "Red team exercise",
      "Code review",
      "Compliance audit"
    ],
    correctAnswer: 1,
    explanation: "Red team exercises simulate real-world attacks to test an organization's detection and response capabilities, providing a comprehensive assessment of security effectiveness.",
    domain: Domain.SECURITY_ASSESSMENT,
    difficulty: Difficulty.MEDIUM,
    tags: ["red-team", "security-testing", "incident-response"]
  },

  // Domain 7: Security Operations
  {
    questionText: "What is the PRIMARY goal of incident response?",
    options: [
      "To punish the attacker",
      "To minimize damage and recover from security incidents",
      "To prevent all future incidents",
      "To document security policies"
    ],
    correctAnswer: 1,
    explanation: "The primary goal of incident response is to minimize damage, preserve evidence, and restore normal operations as quickly as possible after a security incident.",
    domain: Domain.SECURITY_OPERATIONS,
    difficulty: Difficulty.EASY,
    tags: ["incident-response", "security-operations", "recovery"]
  },
  {
    questionText: "What is the correct order of the incident response lifecycle phases?",
    options: [
      "Detection, Preparation, Containment, Eradication, Recovery, Lessons Learned",
      "Preparation, Detection, Containment, Eradication, Recovery, Lessons Learned",
      "Preparation, Detection, Eradication, Containment, Recovery, Lessons Learned",
      "Detection, Containment, Preparation, Eradication, Recovery, Lessons Learned"
    ],
    correctAnswer: 1,
    explanation: "The incident response lifecycle: Preparation, Detection/Analysis, Containment, Eradication, Recovery, and Lessons Learned (Post-Incident Activity).",
    domain: Domain.SECURITY_OPERATIONS,
    difficulty: Difficulty.MEDIUM,
    tags: ["incident-response", "lifecycle", "phases"]
  },
  {
    questionText: "What is the FIRST priority when responding to a security incident?",
    options: [
      "Preserving evidence",
      "Notifying management",
      "Protecting human life and safety",
      "Restoring system availability"
    ],
    correctAnswer: 2,
    explanation: "The first priority in any incident is always protecting human life and safety. This is a fundamental principle in emergency response and incident handling.",
    domain: Domain.SECURITY_OPERATIONS,
    difficulty: Difficulty.EASY,
    tags: ["incident-response", "priorities", "safety"]
  },
  {
    questionText: "What type of disaster recovery site provides the fastest recovery time but is the most expensive?",
    options: [
      "Cold site",
      "Warm site",
      "Hot site",
      "Mobile site"
    ],
    correctAnswer: 2,
    explanation: "A hot site is fully equipped and can take over operations immediately, providing the fastest recovery time but at the highest cost. It includes hardware, software, and data.",
    domain: Domain.SECURITY_OPERATIONS,
    difficulty: Difficulty.EASY,
    tags: ["disaster-recovery", "hot-site", "business-continuity"]
  },
  {
    questionText: "What is the purpose of a Security Operations Center (SOC)?",
    options: [
      "To develop security policies",
      "To monitor, detect, and respond to security incidents",
      "To perform penetration testing",
      "To manage user access rights"
    ],
    correctAnswer: 1,
    explanation: "A SOC is a centralized facility that monitors, detects, analyzes, and responds to security incidents 24/7, serving as the organization's security monitoring hub.",
    domain: Domain.SECURITY_OPERATIONS,
    difficulty: Difficulty.EASY,
    tags: ["soc", "monitoring", "security-operations"]
  },
  {
    questionText: "Which metric measures the average time to recover a system after a failure?",
    options: [
      "RTO",
      "RPO",
      "MTTR",
      "MTBF"
    ],
    correctAnswer: 2,
    explanation: "Mean Time to Repair (MTTR) measures the average time to repair a failed component or system. Lower MTTR indicates better recovery capabilities.",
    domain: Domain.SECURITY_OPERATIONS,
    difficulty: Difficulty.MEDIUM,
    tags: ["metrics", "mttr", "recovery"]
  },

  // Domain 8: Software Development Security
  {
    questionText: "What is the PRIMARY purpose of input validation?",
    options: [
      "To improve application performance",
      "To prevent malicious data from being processed",
      "To encrypt sensitive data",
      "To simplify user interface design"
    ],
    correctAnswer: 1,
    explanation: "Input validation ensures that data entering an application meets expected criteria, preventing injection attacks and other malicious input from being processed.",
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["input-validation", "secure-coding", "owasp"]
  },
  {
    questionText: "Which software development methodology emphasizes security throughout the entire development lifecycle?",
    options: [
      "Waterfall",
      "Agile",
      "DevSecOps",
      "Rapid Application Development"
    ],
    correctAnswer: 2,
    explanation: "DevSecOps integrates security practices throughout the entire development lifecycle, automating security testing and making security everyone's responsibility.",
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["devsecops", "sdLC", "methodology"]
  },
  {
    questionText: "What is the PRIMARY purpose of code review?",
    options: [
      "To increase development speed",
      "To identify security vulnerabilities and coding errors",
      "To reduce project costs",
      "To document code functionality"
    ],
    correctAnswer: 1,
    explanation: "Code review identifies security vulnerabilities, coding errors, and quality issues through manual or automated examination of source code before deployment.",
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["code-review", "secure-coding", "quality"]
  },
  {
    questionText: "What type of testing analyzes program behavior without examining source code?",
    options: [
      "White box testing",
      "Black box testing",
      "Static analysis",
      "Code review"
    ],
    correctAnswer: 1,
    explanation: "Black box testing examines program behavior without access to source code, testing from an external perspective similar to how an attacker would approach the application.",
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["testing", "black-box", "dynamic-analysis"]
  },
  {
    questionText: "What is SQL injection?",
    options: [
      "A database optimization technique",
      "An attack that inserts malicious SQL queries through user input",
      "A method for encrypting database connections",
      "A backup strategy for databases"
    ],
    correctAnswer: 1,
    explanation: "SQL injection is an attack where malicious SQL queries are inserted through user input fields, potentially allowing attackers to access or manipulate database contents.",
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    difficulty: Difficulty.EASY,
    tags: ["sql-injection", "owasp", "web-security"]
  },
  {
    questionText: "Which OWASP Top 10 vulnerability involves executing unintended functions due to insecure deserialization?",
    options: [
      "Injection",
      "Broken Authentication",
      "Insecure Deserialization",
      "Cross-Site Scripting"
    ],
    correctAnswer: 2,
    explanation: "Insecure Deserialization occurs when untrusted data is deserialized, potentially allowing attackers to execute arbitrary code or manipulate application logic.",
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    difficulty: Difficulty.MEDIUM,
    tags: ["owasp", "deserialization", "vulnerabilities"]
  },
  {
    questionText: "What is the PRIMARY purpose of fuzz testing?",
    options: [
      "To verify code logic",
      "To discover vulnerabilities by providing invalid or random input",
      "To measure code coverage",
      "To test user interface design"
    ],
    correctAnswer: 1,
    explanation: "Fuzz testing (fuzzing) provides invalid, unexpected, or random data as input to discover vulnerabilities, crashes, and unexpected behaviors in applications.",
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    difficulty: Difficulty.MEDIUM,
    tags: ["fuzzing", "testing", "vulnerability-discovery"]
  },
]

// Sample Notes - 20+ notes covering all 8 domains
const notes = [
  {
    title: "CISSP Code of Ethics - The Four Canons",
    content: `# (ISC)² Code of Professional Ethics - Four Canons

## Canon 1: Protect Society, the Common Good
- This is "do the right thing"
- Put the common good ahead of yourself
- Ensure the public can have faith in your infrastructure and security
- Any member of the public can file a claim under canon I

## Canon 2: Act Honorably, Honestly, Justly, Responsibly, and Legally
- Always follow the laws
- If conflicting laws from different jurisdictions apply, prioritize the local jurisdiction
- Any member of the public can file a claim under canon II

## Canon 3: Provide Diligent and Competent Service to Principals
- Avoid passing yourself as an expert in areas you aren't qualified
- Maintain and expand your skills
- Only employers or those with contractual relationships can file complaints

## Canon 4: Advance and Protect the Profession
- Don't bring negative publicity to the profession
- Provide competent services, get training, act honorably
- Anyone who subscribes to a code of ethics can file a complaint`,
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    tags: ["ethics", "isc2", "professional-conduct"]
  },
  {
    title: "Five Pillars of Information Security",
    content: `# The Five Pillars of Information Security

## 1. Confidentiality
- Principle that objects are not disclosed to unauthorized subjects
- Measures to ensure protection of secrecy of data, objects, and resources
- Protects authorized access while preventing unauthorized disclosure

## 2. Integrity
- Objects retain their veracity and are modified only by authorized subjects
- Protects reliability and correctness of data
- Guards against improper modification/destruction
- Maintains internal and external consistency

## 3. Availability
- Authorized subjects are granted timely and uninterrupted access to objects
- Techniques: failover clustering, load balancing, redundancy, fault tolerance

## 4. Authenticity
- Ensures transmission, message, or sender is legitimate
- Verifies the claimed identity of an entity

## 5. Nonrepudiation
- Ensures subject cannot deny that an event occurred
- Made possible through identification, authentication, authorization, accountability, and auditing`,
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    tags: ["cia-triad", "security-principles", "fundamentals"]
  },
  {
    title: "Risk Management Formulas",
    content: `# Key Risk Management Formulas

## Asset Value (AV)
The total value of the asset being protected.

## Exposure Factor (EF)
Percentage of asset loss that would occur if a risk event occurs (0 to 1.0).

## Single Loss Expectancy (SLE)
**Formula:** SLE = AV × EF
The expected cost of a single risk event.

## Annualized Rate of Occurrence (ARO)
Estimated frequency of a risk event occurring per year.

## Annualized Loss Expectancy (ALE)
**Formula:** ALE = SLE × ARO
Expected annual financial impact of a risk.

## Cost-Benefit Analysis
Security control should cost less than the ALE reduction it provides:
- Control Value = ALE (before control) - ALE (after control) - Cost of control`,
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    tags: ["risk-assessment", "formulas", "quantitative"]
  },
  {
    title: "Data Classification Levels",
    content: `# Data Classification

## Purpose
Ensure appropriate protection based on sensitivity and business value.

## Common Classification Levels

### Public
- No negative impact if disclosed
- General information available to anyone

### Internal/Private
- Limited negative impact if disclosed
- For internal use only

### Confidential
- Significant negative impact if disclosed
- Requires protection, business-sensitive

### Secret/Restricted
- Serious negative impact if disclosed
- Highly sensitive business information

### Top Secret
- Severe negative impact if disclosed
- Critical information requiring highest protection

## Data Roles
- **Data Owner**: accountable for protection, classification decisions
- **Data Steward**: responsible for data quality and governance
- **Data Custodian**: implements technical controls, day-to-day management
- **Data User**: accesses and uses data per policy`,
    domain: Domain.ASSET_SECURITY,
    tags: ["classification", "data-protection", "roles"]
  },
  {
    title: "Data Remanence and Disposal",
    content: `# Data Remanence and Media Sanitization

## Types of Data Remanence
Data remaining on media after standard deletion attempts.

## Sanitization Methods

### Clearing (Least Effective)
- Overwriting data with new values
- Suitable for media reuse within same organization
- May not work on damaged media

### Purging
- Removes data so it cannot be recovered by laboratory means
- Methods: degaussing, secure overwriting
- Suitable for media reuse outside organization

### Destruction (Most Effective)
- Physical destruction: shredding, incineration, pulverizing
- Ensures data is unrecoverable
- Required for highly classified data

## Degaussing
- Uses strong magnetic field to erase magnetic media
- Effectively destroys data on HDDs and tapes
- Does NOT work on SSDs`,
    domain: Domain.ASSET_SECURITY,
    tags: ["data-remanence", "disposal", "sanitization"]
  },
  {
    title: "Security Models Overview",
    content: `# Security Models

## Bell-LaPadula Model
- **Focus:** Confidentiality
- **Rules:**
  - Simple Security Property: No Read Up
  - Star (*) Property: No Write Down
- Used in military/government

## Biba Model
- **Focus:** Integrity
- **Rules:**
  - Simple Integrity Axiom: No Read Down
  - Star (*) Integrity Axiom: No Write Up
- Prevents unauthorized modification

## Clark-Wilson Model
- **Focus:** Commercial Integrity
- Uses well-formed transactions
- Separation of duties
- Requires user ID, transformation procedures, and constrained data items

## Brewer-Nash (Chinese Wall) Model
- **Focus:** Conflict of Interest
- Prevents access to conflicting datasets
- Dynamic access control based on user's previous access`,
    domain: Domain.SECURITY_ARCHITECTURE,
    tags: ["security-models", "bell-lapadula", "biba"]
  },
  {
    title: "Cryptography Fundamentals",
    content: `# Cryptography Fundamentals

## Symmetric Encryption
- Same key for encryption and decryption
- Fast performance
- Key distribution challenge
- Examples: AES, DES, 3DES, RC4

## Asymmetric Encryption
- Key pair: public key (shared) and private key (secret)
- Slower than symmetric
- Enables digital signatures and secure key exchange
- Examples: RSA, ECC, Diffie-Hellman

## Hash Functions
- One-way function producing fixed-size output
- Ensures integrity
- Examples: SHA-256, MD5 (deprecated), SHA-3

## Digital Signatures
- Provides authenticity, integrity, nonrepudiation
- Created by encrypting hash with private key
- Verified by decrypting with public key

## PKI Components
- Certificate Authority (CA)
- Registration Authority (RA)
- Certificates (X.509)
- CRL and OCSP for revocation`,
    domain: Domain.SECURITY_ARCHITECTURE,
    tags: ["cryptography", "encryption", "pki"]
  },
  {
    title: "Network Security Devices",
    content: `# Network Security Devices

## Firewall Types
- **Packet Filtering:** Examines headers, basic rules
- **Stateful Inspection:** Tracks connection state
- **Application/Proxy:** Deep packet inspection, Layer 7
- **Next-Gen (NGFW):** Combined features, IPS, application awareness

## IDS vs IPS
- **IDS (Detection):** Monitors and alerts, passive
- **IPS (Prevention):** Can block traffic, inline

## Types of Detection
- **Signature-based:** Known patterns
- **Anomaly-based:** Baselining, detects unknown threats
- **Heuristic/Behavioral:** AI/ML-based analysis

## Proxy Servers
- Acts as intermediary
- Content filtering, caching, anonymity
- Forward proxy (outbound) vs Reverse proxy (inbound)

## Web Application Firewall (WAF)
- Protects web applications
- OWASP Top 10 protection
- Layer 7 filtering`,
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    tags: ["firewall", "ids", "ips", "network-security"]
  },
  {
    title: "VPN Technologies",
    content: `# VPN Technologies

## Purpose
Secure communication over untrusted networks using encryption and tunneling.

## VPN Protocols

### IPsec
- Network layer (Layer 3) encryption
- Two modes: Transport (payload only), Tunnel (entire packet)
- Uses AH (integrity) and ESP (confidentiality + integrity)
- IKE for key management

### SSL/TLS VPN
- Application layer
- Browser-based access
- No client software needed
- Portal access vs tunnel mode

### L2TP over IPsec
- Layer 2 Tunneling Protocol
- Combined with IPsec for encryption
- More secure than PPTP

## VPN Types
- **Site-to-Site:** Connects networks
- **Remote Access:** Connects individual users
- **Client-based:** Requires VPN client software
- **Clientless:** Browser-based SSL VPN`,
    domain: Domain.COMMUNICATION_NETWORK_SECURITY,
    tags: ["vpn", "ipsec", "tunneling", "remote-access"]
  },
  {
    title: "Authentication Factors and Methods",
    content: `# Authentication Factors

## Three Main Factors

### Type 1: Something You Know
- Passwords, PINs, security questions
- Vulnerable to phishing, social engineering

### Type 2: Something You Have
- Tokens, smart cards, mobile devices
- Vulnerable to theft

### Type 3: Something You Are
- Biometrics: fingerprints, iris, face recognition
- Cannot be lost or forgotten
- Privacy concerns, false rates

## Biometric Performance
- **FRR (False Rejection Rate):** Valid user rejected
- **FAR (False Acceptance Rate):** Invalid user accepted
- **CER (Crossover Error Rate):** Where FRR = FAR

## Multi-Factor Authentication (MFA)
- Combines two or more different factors
- Significantly increases security
- Examples: Password + SMS code, Password + hardware token`,
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    tags: ["authentication", "mfa", "biometrics"]
  },
  {
    title: "Access Control Models",
    content: `# Access Control Models

## Discretionary Access Control (DAC)
- Owner controls access
- Flexible but less secure
- ACL-based implementation

## Mandatory Access Control (MAC)
- OS-enforced security labels
- Clearances and classifications
- Used in military/government

## Role-Based Access Control (RBAC)
- Access based on job role
- Simplifies administration
- Most common in enterprises

## Rule-Based Access Control
- Rules determine access
- Time-based, location-based
- Often used in firewalls

## Attribute-Based Access Control (ABAC)
- Uses attributes (user, resource, environment)
- Most flexible and dynamic
- Complex to implement`,
    domain: Domain.IDENTITY_ACCESS_MANAGEMENT,
    tags: ["access-control", "rbac", "mac", "dac"]
  },
  {
    title: "Security Testing Types",
    content: `# Security Assessment and Testing

## Vulnerability Assessment
- Identifies known vulnerabilities
- Uses automated scanners
- Does not exploit findings

## Penetration Testing
- Simulates real attacks
- Attempts exploitation
- Tests defenses and response

### Penetration Test Types
- **Black Box:** No prior knowledge
- **Gray Box:** Partial knowledge
- **White Box:** Full knowledge

## Code Review
- Manual or automated
- Identifies security flaws in source code
- Static analysis

## Security Testing in SDLC
- Unit testing, integration testing
- Security regression testing
- Fuzz testing
- Dynamic and static analysis`,
    domain: Domain.SECURITY_ASSESSMENT,
    tags: ["testing", "penetration-testing", "vulnerability-assessment"]
  },
  {
    title: "Incident Response Phases",
    content: `# Incident Response Lifecycle

## 1. Preparation
- Develop IR policies and procedures
- Train team members
- Establish communication channels
- Prepare tools and resources

## 2. Detection and Analysis
- Monitor for incidents
- Identify and categorize
- Gather evidence
- Assess impact and scope

## 3. Containment
- Isolate affected systems
- Prevent spread
- Preserve evidence
- Short-term and long-term containment

## 4. Eradication
- Remove root cause
- Eliminate malware
- Patch vulnerabilities
- Clean affected systems

## 5. Recovery
- Restore systems from clean backups
- Verify system functionality
- Monitor for recurrence
- Return to normal operations

## 6. Lessons Learned
- Conduct post-incident review
- Update procedures
- Improve defenses
- Document findings`,
    domain: Domain.SECURITY_OPERATIONS,
    tags: ["incident-response", "phases", "recovery"]
  },
  {
    title: "Business Continuity and Disaster Recovery",
    content: `# BC/DR Overview

## Business Continuity Planning (BCP)
- Ensures critical operations continue during disruption
- Focus on business processes
- BIA identifies critical functions

## Disaster Recovery Planning (DRP)
- Subset of BCP
- Focus on IT systems recovery
- Technical recovery procedures

## Recovery Metrics
- **RTO (Recovery Time Objective):** Maximum acceptable downtime
- **RPO (Recovery Point Objective):** Maximum acceptable data loss
- **MTD (Maximum Tolerable Downtime):** Absolute maximum downtime

## Recovery Site Types
- **Hot Site:** Fully equipped, immediate failover
- **Warm Site:** Partially equipped, hours to activate
- **Cold Site:** Basic infrastructure, days to activate
- **Mobile Site:** Portable, can be deployed anywhere
- **Mirror Site:** Real-time replication`,
    domain: Domain.SECURITY_OPERATIONS,
    tags: ["bcp", "drp", "recovery", "rto", "rpo"]
  },
  {
    title: "OWASP Top 10 Overview",
    content: `# OWASP Top 10 Security Risks

## 1. Broken Access Control
- Improper access restrictions
- Privilege escalation

## 2. Cryptographic Failures
- Weak encryption
- Improper key management

## 3. Injection
- SQL, NoSQL, OS command injection
- User input not sanitized

## 4. Insecure Design
- Missing security controls in design
- Threat modeling gaps

## 5. Security Misconfiguration
- Default credentials
- Unnecessary features enabled

## 6. Vulnerable Components
- Outdated libraries
- Known vulnerabilities

## 7. Authentication Failures
- Weak password policies
- Session management issues

## 8. Software and Data Integrity Failures
- Insecure deserialization
- Untrusted sources

## 9. Security Logging Failures
- Insufficient logging
- No monitoring

## 10. SSRF (Server-Side Request Forgery)
- Fetching remote resources without validation`,
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    tags: ["owasp", "web-security", "vulnerabilities"]
  },
  {
    title: "Secure SDLC Phases",
    content: `# Secure Software Development Lifecycle

## Requirements Phase
- Security requirements gathering
- Threat modeling
- Compliance requirements

## Design Phase
- Secure architecture design
- Attack surface analysis
- Security patterns

## Implementation Phase
- Secure coding practices
- Code review
- Static analysis

## Testing Phase
- Security testing
- Penetration testing
- Dynamic analysis

## Deployment Phase
- Secure configuration
- Environment hardening
- Security monitoring

## Maintenance Phase
- Patch management
- Vulnerability monitoring
- Incident response

## DevSecOps Integration
- Security in every phase
- Automated security testing
- Continuous security monitoring`,
    domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY,
    tags: ["sdlc", "devsecops", "secure-development"]
  },
]

// Sample Flashcards - 30+ flashcards covering all domains
const flashcards = [
  // Domain 1
  { front: "What is the first canon of the (ISC)² Code of Ethics?", back: "Protect society, the common good, necessary public trust and confidence, and the infrastructure", domain: Domain.SECURITY_RISK_MANAGEMENT },
  { front: "What are the five pillars of information security?", back: "Confidentiality, Integrity, Availability, Authenticity, Nonrepudiation", domain: Domain.SECURITY_RISK_MANAGEMENT },
  { front: "What is the formula for ALE?", back: "ALE = SLE × ARO (Single Loss Expectancy × Annualized Rate of Occurrence)", domain: Domain.SECURITY_RISK_MANAGEMENT },
  { front: "What are the four risk handling strategies?", back: "Avoidance, Transference, Mitigation, Acceptance", domain: Domain.SECURITY_RISK_MANAGEMENT },
  { front: "What is due care vs due diligence?", back: "Due care: taking reasonable steps to protect. Due diligence: verifying and managing those steps properly.", domain: Domain.SECURITY_RISK_MANAGEMENT },

  // Domain 2
  { front: "What is data classification?", back: "The process of categorizing data based on sensitivity level to ensure appropriate protection.", domain: Domain.ASSET_SECURITY },
  { front: "What are the common data classification levels?", back: "Public, Internal/Private, Confidential, Secret, Top Secret", domain: Domain.ASSET_SECURITY },
  { front: "Who is the Data Owner responsible for?", back: "Accountable for data protection, determining classification, and deciding who can access the data.", domain: Domain.ASSET_SECURITY },
  { front: "What is data remanence?", back: "Data remaining on storage media after deletion attempts. Requires proper sanitization.", domain: Domain.ASSET_SECURITY },
  { front: "What are the three levels of media sanitization?", back: "Clearing (overwrite), Purging (degauss), Destruction (physical)", domain: Domain.ASSET_SECURITY },

  // Domain 3
  { front: "What are the Bell-LaPadula model rules?", back: "Simple Security: No Read Up. Star (*) Property: No Write Down. Focus: Confidentiality.", domain: Domain.SECURITY_ARCHITECTURE },
  { front: "What are the Biba model rules?", back: "Simple Integrity: No Read Down. Star (*) Integrity: No Write Up. Focus: Integrity.", domain: Domain.SECURITY_ARCHITECTURE },
  { front: "What is the difference between symmetric and asymmetric encryption?", back: "Symmetric: same key for encrypt/decrypt. Asymmetric: key pair (public/private).", domain: Domain.SECURITY_ARCHITECTURE },
  { front: "What is a Hardware Security Module (HSM)?", back: "Tamper-resistant hardware device for cryptographic key storage and operations.", domain: Domain.SECURITY_ARCHITECTURE },
  { front: "What layer of the OSI model handles encryption?", back: "Layer 6 - Presentation Layer", domain: Domain.SECURITY_ARCHITECTURE },

  // Domain 4
  { front: "What is the purpose of a firewall?", back: "To filter network traffic based on security rules, controlling flow between segments.", domain: Domain.COMMUNICATION_NETWORK_SECURITY },
  { front: "What is the difference between IDS and IPS?", back: "IDS: detects and alerts (passive). IPS: detects and can block (active/inline).", domain: Domain.COMMUNICATION_NETWORK_SECURITY },
  { front: "What is a DMZ?", back: "Demilitarized Zone - network segment hosting public services with limited internal access.", domain: Domain.COMMUNICATION_NETWORK_SECURITY },
  { front: "What is IPsec used for?", back: "Secure IP communications at Layer 3 with authentication and encryption.", domain: Domain.COMMUNICATION_NETWORK_SECURITY },
  { front: "What is a Man-in-the-Middle attack?", back: "Attack where the attacker intercepts and potentially modifies communications between two parties.", domain: Domain.COMMUNICATION_NETWORK_SECURITY },

  // Domain 5
  { front: "What are the three authentication factors?", back: "Something you know (password), Something you have (token), Something you are (biometric).", domain: Domain.IDENTITY_ACCESS_MANAGEMENT },
  { front: "What is the difference between RBAC and MAC?", back: "RBAC: access based on role. MAC: access based on security labels enforced by OS.", domain: Domain.IDENTITY_ACCESS_MANAGEMENT },
  { front: "What is Single Sign-On (SSO)?", back: "Authentication once to access multiple systems without re-authenticating.", domain: Domain.IDENTITY_ACCESS_MANAGEMENT },
  { front: "What protocol does Windows use for domain authentication?", back: "Kerberos - uses tickets and symmetric key cryptography.", domain: Domain.IDENTITY_ACCESS_MANAGEMENT },
  { front: "What is FAR in biometrics?", back: "False Acceptance Rate - percentage of invalid users incorrectly accepted.", domain: Domain.IDENTITY_ACCESS_MANAGEMENT },

  // Domain 6
  { front: "What is the main difference between vulnerability scan and penetration test?", back: "Vulnerability scan identifies issues. Penetration test attempts to exploit them.", domain: Domain.SECURITY_ASSESSMENT },
  { front: "What is black box testing?", back: "Testing with no prior knowledge of the target, simulating an external attacker.", domain: Domain.SECURITY_ASSESSMENT },
  { front: "What is fuzz testing?", back: "Testing by providing invalid, unexpected, or random input to discover vulnerabilities.", domain: Domain.SECURITY_ASSESSMENT },
  { front: "What is a red team exercise?", back: "Simulated attack to test detection and response capabilities.", domain: Domain.SECURITY_ASSESSMENT },

  // Domain 7
  { front: "What is the first priority in incident response?", back: "Protect human life and safety.", domain: Domain.SECURITY_OPERATIONS },
  { front: "What are the six incident response phases?", back: "Preparation, Detection/Analysis, Containment, Eradication, Recovery, Lessons Learned.", domain: Domain.SECURITY_OPERATIONS },
  { front: "What is the difference between RTO and RPO?", back: "RTO: max downtime. RPO: max data loss (time).", domain: Domain.SECURITY_OPERATIONS },
  { front: "What is a hot site?", back: "Fully equipped recovery site that can take over operations immediately.", domain: Domain.SECURITY_OPERATIONS },
  { front: "What is MTTR?", back: "Mean Time to Repair - average time to recover a system after failure.", domain: Domain.SECURITY_OPERATIONS },

  // Domain 8
  { front: "What is SQL injection?", back: "Attack inserting malicious SQL through user input to manipulate database.", domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY },
  { front: "What is input validation?", back: "Verifying data meets expected criteria before processing to prevent attacks.", domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY },
  { front: "What is DevSecOps?", back: "Integrating security practices throughout the entire development lifecycle.", domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY },
  { front: "What is code review?", back: "Manual or automated examination of source code to identify vulnerabilities and errors.", domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY },
  { front: "What is insecure deserialization?", back: "Vulnerability where untrusted data deserialization allows code execution or logic manipulation.", domain: Domain.SOFTWARE_DEVELOPMENT_SECURITY },
]

async function main() {
  console.log('Starting seed...')

  // Check if data already exists
  const existingQuestions = await prisma.question.count()
  const existingNotes = await prisma.note.count()
  const existingFlashcards = await prisma.flashcard.count()

  if (existingQuestions > 0 || existingNotes > 0 || existingFlashcards > 0) {
    console.log('Database already contains data. Skipping seed.')
    console.log(`Questions: ${existingQuestions}, Notes: ${existingNotes}, Flashcards: ${existingFlashcards}`)
    return
  }

  console.log('Seeding questions...')
  for (const question of questions) {
    await prisma.question.create({ data: question })
  }
  console.log(`Created ${questions.length} questions`)

  console.log('Seeding notes...')
  for (const note of notes) {
    await prisma.note.create({ data: note })
  }
  console.log(`Created ${notes.length} notes`)

  console.log('Seeding flashcards...')
  const now = new Date()
  for (const card of flashcards) {
    await prisma.flashcard.create({
      data: {
        ...card,
        nextReview: now,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
      },
    })
  }
  console.log(`Created ${flashcards.length} flashcards`)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
