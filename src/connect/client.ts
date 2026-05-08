import type {
  Device,
  DeviceListOptions,
  Group,
  GroupListOptions,
  ListResponse,
  Package,
  PackageListOptions,
  SingleResponse,
} from "./types.js";

const BASE_URL = "https://app.pdq.com";
const PAGE_SIZE = 100;

export class PDQConnectError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PDQConnectError";
  }
}

export class PDQConnectClient {
  private readonly headers: Record<string, string>;

  constructor(apiKey: string) {
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
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
    params?: Record<string, string | number | undefined>,
    body?: unknown
  ): Promise<T> {
    const url = new URL(path, BASE_URL);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers: this.headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      throw new PDQConnectError(401, "Unauthorized — check your API key.");
    }

    if (res.status === 403) {
      throw new PDQConnectError(
        403,
        "Forbidden — your API key lacks permission for this resource."
      );
    }

    if (res.status === 404) {
      throw new PDQConnectError(404, "Not found.");
    }

    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new PDQConnectError(res.status, `API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  private async getAll<T>(
    path: string,
    params: Record<string, string | number | undefined>
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (true) {
      const res = await this.request<ListResponse<T>>("GET", path, {
        ...params,
        page,
        pageSize: PAGE_SIZE,
      });
      if (!res?.data) break;
      results.push(...res.data);
      if (res.data.length < PAGE_SIZE) break;
      page++;
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Devices
  // -----------------------------------------------------------------------

  async listDevices(opts: DeviceListOptions = {}): Promise<Device[]> {
    const params: Record<string, string | number | undefined> = {
      group: opts.group,
      sort: opts.sort,
      includes: opts.includes,
    };

    // Serialize deepObject filter params: filter[key]=value
    if (opts.filter) {
      for (const [k, v] of Object.entries(opts.filter)) {
        params[`filter[${k}]`] = v;
      }
    }

    if (opts.page !== undefined) {
      // Single page
      params["page"] = opts.page;
      params["pageSize"] = opts.pageSize ?? PAGE_SIZE;
      const res = await this.request<ListResponse<Device>>("GET", "/v1/api/devices", params);
      return res.data;
    }

    return this.getAll<Device>("/v1/api/devices", params);
  }

  async getDevice(deviceId: string): Promise<Device> {
    const res = await this.request<SingleResponse<Device>>("GET", `/v1/api/devices/${deviceId}`);
    return res.data;
  }

  // -----------------------------------------------------------------------
  // Groups
  // -----------------------------------------------------------------------

  async listGroups(opts: GroupListOptions = {}): Promise<Group[]> {
    const params: Record<string, string | number | undefined> = {
      sort: opts.sort,
    };
    if (opts.filter) {
      for (const [k, v] of Object.entries(opts.filter)) {
        params[`filter[${k}]`] = v;
      }
    }
    return this.getAll<Group>("/v1/api/groups", params);
  }

  // -----------------------------------------------------------------------
  // Packages
  // -----------------------------------------------------------------------

  async listPackages(opts: PackageListOptions = {}): Promise<Package[]> {
    const params: Record<string, string | number | undefined> = {
      sort: opts.sort,
    };
    if (opts.filter) {
      for (const [k, v] of Object.entries(opts.filter)) {
        params[`filter[${k}]`] = v;
      }
    }
    return this.getAll<Package>("/v1/api/packages", params);
  }

  async getPackage(packageId: string): Promise<Package> {
    const res = await this.request<SingleResponse<Package>>("GET", `/v1/api/packages/${packageId}`);
    return res.data;
  }

  // -----------------------------------------------------------------------
  // Deployments
  // -----------------------------------------------------------------------

  async createDeployment(packageId: string, targetIds: string[]): Promise<void> {
    await this.request<undefined>("POST", "/v1/api/deployments", {
      package: packageId,
      targets: targetIds.join(","),
    });
  }
}
