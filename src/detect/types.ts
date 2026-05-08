// ---------------------------------------------------------------------------
// Types derived from the PDQ Detect / CODA Footprint OpenAPI spec (v7.18.19)
// ---------------------------------------------------------------------------

// ── Pagination ──────────────────────────────────────────────────────────────

export interface Paginated<T> {
  page: number;
  totalPages: number;
  totalCount: number;
  items: T[];
}

// ── Devices ─────────────────────────────────────────────────────────────────

export interface DeviceScannerData {
  name: string;
}

export interface DevicePorts {
  tcp: number[];
  udp: number[];
}

export interface DeviceTags {
  id?: number;
  name?: string;
}

export interface DeviceAgentStatus {
  status?: string;
}

/** Item returned by GET /console/elements/devices/ */
export interface DeviceListing {
  id: number;
  isOnline: boolean;
  name: string;
  ip: string;
  type: "AgentDevice" | "Server";
  scanSource: string;
  scanType: string;
  scanner: DeviceScannerData;
  lastSeen: string;
  lastScanned: string;
  ports: DevicePorts;
  discoveredOn: string;
  riskLevel: string; // "secure" | "unknown" | "vulnerable" | "critical" (or numeric 0-3)
  deviceState: "AVAILABLE" | "DECOMMISSIONED";
  isScanned: boolean;
  isScannerDeleted: boolean;
  isScannerOnline?: boolean;
  agentStatus: DeviceAgentStatus | null;
  tags: DeviceTags[];
  icmpPing: boolean;
  businessContextsNames: string[];
  technicalContextsNames: string[];
  os: string;
}

/** Returned by GET /console/elements/device/{id}/overview/ */
export interface DeviceOverview {
  os: string;
  installDate: string;
  lastBootupDate: string;
  applications: ApplicationDetails[];
  installedUpdates: DeviceInstalledUpdate[];
  securityProducts: string;
  firewallProfiles: string;
}

export interface DeviceInstalledUpdate {
  name?: string;
  installedDate?: string;
}

/** Returned by GET /console/elements/device/{id}/os/ */
export interface DeviceOS {
  isOutdated: boolean;
  isSpring4shellAvailable: boolean | null;
  osType: string;
}

/** Returned by GET /console/elements/device/{id}/users/ (plain array) */
export interface DeviceUser {
  accountType: string;
  description: string;
  disabled: string;
  name: string;
  passwordExpires: string;
}

// ── Applications ────────────────────────────────────────────────────────────

export interface AgentApplicationInformationOrigin {
  type?: string;
}

/** Item returned by GET /console/elements/applications/ */
export interface ApplicationListing {
  id: number;
  icon?: string;
  name: string;
  type?: string;
  riskLevel: number; // 0, 1, 2, 3
  isOnline: boolean;
  applicationType: string;
  discoveredOn: string;
  lastSeen: string;
  lastScanned: string;
  ip: string;
  cpe: string;
  url: string;
  version: string;
  protocol: string;
  transportProtocol: string | null;
  port: number;
  hostname: string;
  isScanned: boolean;
  isDiscoveredByAgent: boolean;
  userEdited: boolean;
  osName: string;
  informationOrigin: AgentApplicationInformationOrigin;
  applicationCrs: number;
  riskLevelByCrs: string;
  crsColor: string;
  status: string;
  isUserInputDeleted: boolean;
}

/** Returned by GET /console/elements/application/{id}/ and device apps */
export interface ApplicationDetails {
  id: number;
  icon?: string;
  name: string;
  type: string;
  riskLevel: string; // "secure" | "unknown" | "vulnerable" | "critical"
  isOnline: boolean;
  applicationType: string;
  discoveredOn: string;
  lastSeen: string;
  lastScanned: string;
  ip: string;
  cpe: string;
  url: string;
  version: string;
  protocol: string;
  port: number;
  hostname: string;
  isScanned: boolean;
  isDiscoveredByAgent: boolean;
  userEdited: boolean;
  transportProtocol: string | null;
  osName: string;
  numberOfCves: number;
  numberOfAttackAvenues: number;
  informationOrigin: AgentApplicationInformationOrigin | null;
  status: string;
  crss: number;
  isUserInputDeleted: boolean;
}

// ── Vulnerabilities ─────────────────────────────────────────────────────────

export interface CveListInstanceStats {
  [key: string]: number;
}

/** Item returned by GET /console/reporting/cveManager/ */
export interface CveListing {
  cve: string;
  summary: string | null;
  severity: string;
  datePublished: string | null;
  dateModified: string | null;
  cvssBase: number | string; // number or "N/A"
  cvssAttackVector: string;
  cvssImpact: number | null;
  cvssExploit: number | null;
  cvssAttackComplexity: string | null;
  cvssPrivilegesRequired: string | null;
  cvssUserInteraction: string | null;
  cvssScope: string | null;
  cvssConfidentialityImpact: string | null;
  cvssIntegrityImpact: string | null;
  cvssAvailabilityImpact: string | null;
  cvssVectorString: string | null;
  references: string[];
  cvssBaseSeverity: string | null; // "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  problemTypeData: string | null;
  remediation: string;
  isWeaponized: boolean;
  firstDiscovered: string;
  lastSeen: string;
  states: CveListInstanceStats;
  affectedApplicationsCount: number;
  affectedDevicesCount: number;
}

export type VulnState =
  | "discovered"
  | "addedToActionPlan"
  | "fixPendingConfirmation"
  | "fixNotConfirmed"
  | "fixConfirmed"
  | "falsePositive"
  | "acceptRisk"
  | "rediscovered";

export interface AttackVector {
  type?: string;
}

/** Item in GET /console/elements/device/{id}/vulnerabilities/ */
export interface VulnerabilityElement {
  id: number;
  discovered: string;
  motivationText: string;
  remediation: string;
  elementId: number;
  cve: string;
  summary: string | null;
  published: string | null;
  cvssScore: number | string | null;
  cvssImpact: number | null;
  cvssExploit: number | null;
  cvssScope: string | null;
  cvssPrivilegesRequired: string | null;
  cvssConfidentialityImpact: string | null;
  cvssAvailabilityImpact: string | null;
  cvssVectorString: string | null;
  cvssIntegrityImpact: string | null;
  isPublicExploitAvailable: boolean;
  cvssBaseSeverity: string | null;
  attackVector: AttackVector;
  isCritical: boolean;
  isVulnerable: boolean;
  isLowSeverity: boolean;
  isMediumSeverity: boolean;
  isHighSeverity: boolean;
  isCriticalSeverity: boolean;
  problemTypeData: string;
  state: VulnState;
  references: string[];
  exploits: string[];
  fixedReason: string;
  affected: string;
  informationOrigin: AgentApplicationInformationOrigin | null;
  lastSeen: string;
  lastStateChanged: string;
  rleDetails: string;
}

// ── Scan Surface ─────────────────────────────────────────────────────────────

export interface ScanSurfaceUser {
  id?: number;
  username?: string;
}

export interface ScanSurfaceScannerEntry {
  scannerId?: number;
  scannerName?: string;
  lastScan?: string;
  status?: string;
  assetCount?: number;
}

export interface ScanSurfaceEntry {
  id: number;
  user: ScanSurfaceUser;
  scanDate: string;
  input: string;
  scanners: ScanSurfaceScannerEntry[];
}

export interface ScanUuidScannerId {
  scanUuid: string;
  scannerId: number;
}

export interface ExtendMessageRequest {
  scanTargets: string[];
  scanners: number[];
  credentialsIds?: number[] | null;
}

// ── Common query option types ─────────────────────────────────────────────────

export interface DeviceListOptions {
  name?: string;
  ip?: string;
  os?: string;
  riskLevel?: string;
  status?: string;
  scanType?: string;
  scanSource?: string;
  scannerId?: number;
  scope?: "all" | "external" | "internal";
  tags?: string;
  page?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: "ascending" | "descending";
}

export interface ApplicationListOptions {
  filter?: string;
  riskLevel?: string;
  scanType?: string;
  scope?: "all" | "external" | "internal";
  status?: string;
  page?: number;
  size?: number;
  sortColumn?: string;
  sortDirection?: "ascending" | "descending";
}

export interface CveListOptions {
  filter?: string;
  filterColumn?: string;
  onlyOpenStates?: boolean;
  page?: number;
  size?: number;
  sortColumn?: string;
  sortDirection?: "ascending" | "descending";
}

export interface ScanSurfaceListOptions {
  page?: number;
  scannerId?: number;
  textFilter?: string;
}
