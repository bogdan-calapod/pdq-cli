import type {
  ApplicationDetails,
  ApplicationListOptions,
  ApplicationListing,
  CveListing,
  CveListOptions,
  DeviceListing,
  DeviceListOptions,
  DeviceOS,
  DeviceOverview,
  DeviceUser,
  ExtendMessageRequest,
  Paginated,
  ScanSurfaceEntry,
  ScanSurfaceListOptions,
  ScanUuidScannerId,
  VulnerabilityElement,
} from "./types.js";

export const DETECT_DEFAULT_BASE_URL = "https://detect.pdq.com";

export class PDQDetectError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PDQDetectError";
  }
}

export class PDQDetectClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly tenantId: number | undefined;
  private readonly debug: boolean;

  constructor(
    apiKey: string,
    baseUrl: string = DETECT_DEFAULT_BASE_URL,
    tenantId?: number,
    debug = false
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.tenantId = tenantId;
    this.debug = debug;
    this.headers = {
      // The Footprint API uses a custom header for API key auth
      FootprintApiKey: apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api${path}`);

    if (this.tenantId !== undefined) {
      url.searchParams.set("tId", String(this.tenantId));
    }

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    if (this.debug) {
      console.error(`[debug] ${method} ${url.toString()}`);
    }

    const res = await fetch(url.toString(), {
      method,
      headers: this.headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    if (this.debug) {
      console.error(`[debug] Response: ${res.status} ${res.statusText}`);
    }

    if (res.status === 401) {
      throw new PDQDetectError(401, "Unauthorized — check your API key.");
    }
    if (res.status === 403) {
      throw new PDQDetectError(403, "Forbidden — insufficient permissions.");
    }
    if (res.status === 404) {
      throw new PDQDetectError(404, "Not found.");
    }
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new PDQDetectError(res.status, `API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  private async getAll<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>,
    pageKey = "page",
    sizeKey = "pageSize",
    pageSize = 100
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (true) {
      const res = await this.request<Paginated<T>>("GET", path, {
        ...params,
        [pageKey]: page,
        [sizeKey]: pageSize,
      });
      if (!res?.results) break;
      results.push(...res.results);
      if (!res.next) break;
      page++;
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Devices
  // -----------------------------------------------------------------------

  async listDevices(opts: DeviceListOptions = {}): Promise<DeviceListing[]> {
    return this.getAll<DeviceListing>(
      "/console/elements/devices/",
      {
        name: opts.name,
        ip: opts.ip,
        os: opts.os,
        riskLevel: opts.riskLevel,
        status: opts.status,
        scanType: opts.scanType,
        tags: opts.tags,
        sortColumn: opts.sortColumn,
        sortDirection: opts.sortDirection,
      },
      "page",
      "pageSize"
    );
  }

  async getDeviceOverview(deviceId: number): Promise<DeviceOverview> {
    return this.request<DeviceOverview>("GET", `/console/elements/device/${deviceId}/overview/`);
  }

  async getDeviceOS(deviceId: number): Promise<DeviceOS> {
    return this.request<DeviceOS>("GET", `/console/elements/device/${deviceId}/os/`);
  }

  async getDeviceUsers(deviceId: number): Promise<DeviceUser[]> {
    return this.request<DeviceUser[]>("GET", `/console/elements/device/${deviceId}/users/`);
  }

  async getDeviceVulnerabilities(
    deviceId: number,
    opts: { page?: number; state?: string; search?: string } = {}
  ): Promise<Paginated<VulnerabilityElement>> {
    return this.request<Paginated<VulnerabilityElement>>(
      "GET",
      `/console/elements/device/${deviceId}/vulnerabilities/`,
      {
        page: opts.page ?? 1,
        "state[]": opts.state,
        search: opts.search,
      }
    );
  }

  async getDeviceApplications(deviceId: number): Promise<Paginated<ApplicationListing>> {
    return this.request<Paginated<ApplicationListing>>(
      "GET",
      `/console/elements/device/${deviceId}/applications/`
    );
  }

  // -----------------------------------------------------------------------
  // Applications
  // -----------------------------------------------------------------------

  async listApplications(opts: ApplicationListOptions = {}): Promise<ApplicationListing[]> {
    return this.getAll<ApplicationListing>(
      "/console/elements/applications/",
      {
        filter: opts.filter,
        riskLevel: opts.riskLevel,
        scanType: opts.scanType,
        status: opts.status,
        sortColumn: opts.sortColumn,
        sortDirection: opts.sortDirection,
      },
      "page",
      "size"
    );
  }

  async getApplication(applicationId: number): Promise<ApplicationDetails> {
    return this.request<ApplicationDetails>(
      "GET",
      `/console/elements/application/${applicationId}/`
    );
  }

  // -----------------------------------------------------------------------
  // Vulnerabilities (CVE Manager)
  // -----------------------------------------------------------------------

  async listVulnerabilities(opts: CveListOptions = {}): Promise<CveListing[]> {
    return this.getAll<CveListing>(
      "/console/reporting/cveManager/",
      {
        filter: opts.filter,
        filterColumn: opts.filterColumn,
        onlyOpenStates: opts.onlyOpenStates,
        sortColumn: opts.sortColumn,
        sortDirection: opts.sortDirection,
      },
      "page",
      "size"
    );
  }

  // -----------------------------------------------------------------------
  // Scan Surface
  // -----------------------------------------------------------------------

  async listScanSurface(opts: ScanSurfaceListOptions = {}): Promise<ScanSurfaceEntry[]> {
    return this.getAll<ScanSurfaceEntry>(
      "/console/scanSurface/",
      {
        scannerId: opts.scannerId,
        textFilter: opts.textFilter,
      },
      "page",
      "size"
    );
  }

  async addScanSurface(
    userInputs: string[],
    scannerId?: string,
    noScan = false
  ): Promise<ScanUuidScannerId[]> {
    const body: ExtendMessageRequest = { userInputs, scannerId };
    return this.request<ScanUuidScannerId[]>(
      "POST",
      "/console/scanSurface/",
      { isNoScanRequest: noScan ? "true" : undefined },
      body
    );
  }

  async rescanAll(): Promise<ScanUuidScannerId[]> {
    return this.request<ScanUuidScannerId[]>(
      "PATCH",
      "/console/scanSurface/rescan/",
      undefined,
      {}
    );
  }

  async deleteScanSurface(userInputIds: number[], deleteAssets = false): Promise<void> {
    return this.request<void>("DELETE", "/console/scanSurface/", {
      userInputsIds: userInputIds.join(","),
      deleteAssets: deleteAssets ? "true" : undefined,
    });
  }
}
