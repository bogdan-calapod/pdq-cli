// ---------------------------------------------------------------------------
// Types derived from the PDQ Detect / CODA Footprint OpenAPI spec (v7.18.19)
// ---------------------------------------------------------------------------

// ── Pagination ──────────────────────────────────────────────────────────────

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Devices ─────────────────────────────────────────────────────────────────

export type RiskLevel = "critical" | "high" | "medium" | "low" | "none";
export type DeviceStatus = "active" | "inactive" | "unknown";
export type ScanType = "agent" | "agentless" | "network_edge";

export interface DeviceListing {
  id: number;
  name: string;
  ip?: string;
  os?: string;
  riskLevel?: RiskLevel;
  status?: DeviceStatus;
  scanType?: ScanType;
  lastSeen?: string;
  lastScanned?: string;
  tags?: string[];
  businessContexts?: string[];
  technicalContexts?: string[];
}

export interface DeviceOverview {
  id: number;
  name: string;
  ip?: string;
  os?: string;
  osVersion?: string;
  riskLevel?: RiskLevel;
  status?: DeviceStatus;
  scanType?: ScanType;
  lastSeen?: string;
  lastScanned?: string;
  discovered?: string;
  tags?: string[];
  businessContexts?: ContextRef[];
  technicalContexts?: ContextRef[];
  vulnerabilityCount?: number;
  criticalVulnerabilityCount?: number;
  highVulnerabilityCount?: number;
  mediumVulnerabilityCount?: number;
  lowVulnerabilityCount?: number;
}

export interface DeviceOS {
  name?: string;
  version?: string;
  architecture?: string;
  servicePack?: string;
  kernel?: string;
  buildNumber?: string;
  installDate?: string;
  lastBootTime?: string;
}

export interface ContextRef {
  id: number;
  name: string;
}

export interface DeviceUser {
  username?: string;
  domain?: string;
  lastLogon?: string;
  isAdmin?: boolean;
}

// ── Applications ────────────────────────────────────────────────────────────

export interface ApplicationListing {
  id: number;
  name: string;
  version?: string;
  publisher?: string;
  riskLevel?: RiskLevel;
  status?: DeviceStatus;
  scanType?: ScanType;
  deviceCount?: number;
  vulnerabilityCount?: number;
  scope?: string;
}

export interface ApplicationDetails {
  id: number;
  name: string;
  version?: string;
  publisher?: string;
  riskLevel?: RiskLevel;
  status?: DeviceStatus;
  scanType?: ScanType;
  deviceCount?: number;
  vulnerabilityCount?: number;
  criticalVulnerabilityCount?: number;
  highVulnerabilityCount?: number;
  mediumVulnerabilityCount?: number;
  lowVulnerabilityCount?: number;
  cpeNames?: string[];
}

// ── Vulnerabilities ─────────────────────────────────────────────────────────

export type VulnState = "open" | "accepted_risk" | "in_review" | "resolved" | "false_positive";

export interface CveListing {
  id: number;
  cve?: string;
  summary?: string;
  cvssBase?: number;
  isWeaponized?: boolean;
  isExploitable?: boolean;
  affectedDevices?: number;
  affectedApplications?: number;
  publishedDate?: string;
  state?: VulnState;
}

export interface VulnerabilityElement {
  id: number;
  cve?: string;
  summary?: string;
  cvssBase?: number;
  isWeaponized?: boolean;
  state?: VulnState;
  remediation?: string;
  publishedDate?: string;
}

// ── Scan Surface ─────────────────────────────────────────────────────────────

export interface ScanSurfaceEntry {
  id: number;
  userInput: string;
  scannerId?: string;
  scannerName?: string;
  assetCount?: number;
  lastScan?: string;
  status?: string;
  scope?: string;
}

export interface ScanUuidScannerId {
  scanUuid: string;
  scannerId: string;
}

export interface ExtendMessageRequest {
  userInputs: string[];
  scannerId?: string;
}

// ── Scans ────────────────────────────────────────────────────────────────────

export type ScanStatus = "created" | "running" | "done" | "interrupted" | "requested" | "stopped";

export interface ScanListing {
  uuid: string;
  scannerId?: string;
  scannerName?: string;
  status?: ScanStatus;
  startDate?: string;
  endDate?: string;
  assetsDiscovered?: number;
  vulnerabilitiesFound?: number;
}

// ── Status ───────────────────────────────────────────────────────────────────

export interface ServerStatus {
  status?: string;
  version?: string;
  uptime?: number;
}

// ── Common query option types ─────────────────────────────────────────────────

export interface DeviceListOptions {
  name?: string;
  ip?: string;
  os?: string;
  riskLevel?: RiskLevel;
  status?: DeviceStatus;
  scanType?: ScanType;
  tags?: string;
  page?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: "ascending" | "descending";
}

export interface ApplicationListOptions {
  filter?: string;
  riskLevel?: RiskLevel;
  scanType?: ScanType;
  status?: DeviceStatus;
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
  scannerId?: string;
  textFilter?: string;
}
