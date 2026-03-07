// ---------------------------------------------------------------------------
// Types derived from the PDQ Connect OpenAPI spec (app.pdq.com/v1/openapi)
// ---------------------------------------------------------------------------

export interface Device {
  id: string;
  name?: string;
  hostname?: string;
  os?: string;
  osVersion?: string;
  osFullName?: string;
  osProductType?: string;
  architecture?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  chassis?: string;
  family?: string;
  sku?: string;
  systemVersion?: string;
  biosVersion?: string;
  biosManufacturer?: string;
  biosAssetTag?: string;
  memory?: number;
  freePercent?: number;
  requireReboot?: boolean;
  smbVersionOne?: boolean;
  currentUser?: string;
  lastUser?: string;
  lastUserShortName?: string;
  publicIpAddress?: string;
  macAddress?: string;
  timezone?: string;
  servicePack?: string;
  powershellVersion?: string;
  dotNetVersions?: string;
  lastSeenAt?: string;
  lastBootUpTime?: string;
  osInstallDate?: string;
  insertedAt?: string;
  updatedAt?: string;
  // Nested includes
  disks?: Disk[];
  processors?: Processor[];
  networking?: Networking[];
  software?: Software[];
  updates?: Update[];
  drivers?: Driver[];
  features?: Feature[];
  activeDirectory?: ActiveDirectory[];
  activeDirectoryGroups?: ActiveDirectoryGroup[];
}

export interface Disk {
  id: string;
  diskNumber?: number;
  model?: string;
  manufacturer?: string;
  mediaType?: string;
  busType?: string;
  driveType?: string;
  healthStatus?: string;
  operationalStatus?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  totalSpaceKb?: number;
  partitions?: Partition[];
}

export interface Partition {
  id: string;
  driveLetter?: string;
  fileSystem?: string;
  fileSystemLabel?: string;
  sizeKb?: number;
  sizeRemainingKb?: number;
  freePercent?: number;
  isBoot?: boolean;
  isSystem?: boolean;
  isHidden?: boolean;
  isOffline?: boolean;
  partitionType?: "mbr" | "gpt";
  partitionNumber?: number;
  healthStatus?: string;
  operationalStatus?: string;
  volumeStatus?: string;
  encryptionMethod?: string;
  encryptionPercentage?: number;
  protectionStatus?: string;
  lockStatus?: string;
  keyProtector?: string;
  autoUnlockEnabled?: boolean;
  autoUnlockKeyStored?: boolean;
}

export interface Processor {
  id: string;
  name?: string;
  description?: string;
  manufacturer?: string;
  numberOfCores?: number;
  numberOfLogicalProcessors?: number;
  numberOfEnabledCore?: number;
  maxClockSpeed?: number;
  lTwoCacheSize?: number;
  lThreeCacheSize?: number;
  cpuId?: string;
  assetTag?: string;
  status?: string;
}

export interface Networking {
  id: string;
  alias?: string;
  description?: string;
  ipv4Address?: string;
  ipv4Gateway?: string;
  ipv6Address?: string;
  ipv6Gateway?: string;
  linkSpeed?: string;
  index?: number;
  dnsServer?: string[];
  netAdapterStatus?: string;
  netProfileName?: string;
}

export interface Software {
  id: string;
  name?: string;
  title?: string;
  publisher?: string;
  versionRaw?: string;
  version?: number[];
  path?: string;
  uninstall?: string;
  hive?: string;
  installedAt?: string;
}

export interface Update {
  id: string;
  title?: string;
  description?: string;
  date?: string;
  result?: string;
  supportUrl?: string;
}

export interface Driver {
  id: string;
  name?: string;
  driverId?: string;
  provider?: string;
  version?: string;
  class?: string;
  signer?: string;
  date?: string;
}

export interface Feature {
  id: string;
  name?: string;
  caption?: string;
  enabled?: boolean;
}

export interface ActiveDirectory {
  id: string;
  domain?: string;
  domainController?: string;
  distinguishedName?: string;
  deviceName?: string;
  description?: string;
  domainJoined?: boolean;
  azureAdJoined?: boolean;
  entraDeviceId?: string;
  entraTenanId?: string;
  enraTenantName?: string;
  lastLogon?: string;
}

export interface ActiveDirectoryGroup {
  id: string;
  name?: string;
  description?: string;
  distinguishedName?: string;
  guid?: string;
}

export interface Group {
  id: string;
  name?: string;
  source?: "pdq" | "custom";
  type?: "dynamic" | "static";
  insertedAt?: string;
}

export interface Package {
  id: string;
  name?: string;
  publisher?: string;
  source?: "pdq" | "custom";
  packageVersions?: PackageVersion[];
}

export interface PackageVersion {
  id: string;
  version?: string;
  displayVersion?: string | null;
  description?: string;
  releasedAt?: string;
}

// API response wrappers
export interface ListResponse<T> {
  data: T[];
}

export interface SingleResponse<T> {
  data: T;
}

export interface ErrorsResponse {
  errors: Array<{ status: number; detail: string }>;
}

// Filter/sort options passed to list endpoints
export interface DeviceListOptions {
  page?: number;
  pageSize?: number;
  group?: string;
  sort?: string;
  filter?: Record<string, string>;
  includes?: string;
}

export interface GroupListOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  filter?: Record<string, string>;
}

export interface PackageListOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  filter?: Record<string, string>;
}
