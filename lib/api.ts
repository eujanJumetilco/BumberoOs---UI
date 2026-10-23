// Typed client for the BumberoOS REST API (see Server_Guide.md).
import { setAccount } from "./auth";
import { getSettings } from "./settings";
import { DISPLAY_TIMEZONE } from "./settingsShared";

export type StaffAvailability = "UNAVAILABLE" | "AVAILABLE" | "DISPATCHED";
export type IncidentNature = "EMERGENCY" | "NON_EMERGENCY";
export type IncidentStatus = "ONGOING" | "RESOLVED";
export type ItemCategory =
  | "ENGINE" | "AMBULANCE" | "FIRST_AID" | "SCBA" | "FIRE_SUIT" | "HOSE" | "RESCUE_TOOL" | "OTHER";
export type ItemCondition = "GOOD" | "DAMAGED" | "RETIRED";
export type ItemAvailability = "AVAILABLE" | "PARTIALLY_DISPATCHED" | "DISPATCHED" | "UNAVAILABLE";
export type UserRole = "ADMIN" | "DISPATCHER";

export const ALARM_LEVELS = [
  "FIRST_ALARM", "SECOND_ALARM", "THIRD_ALARM", "FOURTH_ALARM", "FIFTH_ALARM",
  "TASK_FORCE_ALPHA", "TASK_FORCE_BRAVO", "TASK_FORCE_CHARLIE", "TASK_FORCE_DELTA",
  "TASK_FORCE_ECHO", "TASK_FORCE_HOTEL", "TASK_FORCE_INDIA", "GENERAL_ALARM",
] as const;
export type AlarmLevel = (typeof ALARM_LEVELS)[number];

export const ITEM_CATEGORIES: ItemCategory[] = [
  "ENGINE", "AMBULANCE", "FIRST_AID", "SCBA", "FIRE_SUIT", "HOSE", "RESCUE_TOOL", "OTHER",
];

export type Staff = {
  id: number;
  name: string;
  role: string;
  contactNumber: string | null;
  address: string | null;
  employed: boolean;
  availability: StaffAvailability;
  trainings: string[];
  certifications: string[];
  dateJoined: string | null;
  /** Brigade ID: exactly 7 digits, unique. */
  badgeNumber: string | null;
};

export type Item = {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  condition: ItemCondition;
  lastMaintained: string | null;
  category: ItemCategory;
  serialNumber: string | null;
  quantityDispatched: number;
  quantityAvailable: number;
  availability: ItemAvailability;
  /** For items that expire (extinguishers, medical stock). */
  expiryDate: string | null;
};

export type AlertType = "EXPIRED" | "EXPIRING_SOON" | "MAINTENANCE_DUE" | "LOW_STOCK" | "VEHICLE_DAMAGED";
export type AlertSeverity = "HIGH" | "MEDIUM";

/** itemId is null for category-wide alerts such as LOW_STOCK. */
export type InventoryAlert = {
  type: AlertType;
  severity: AlertSeverity;
  itemId: number | null;
  itemName: string | null;
  category: ItemCategory;
  message: string;
};

export type CategoryRule = {
  category: ItemCategory;
  lowStockThreshold: number;
  /** null = use the station-wide interval, 0 = no reminders for this category. */
  maintenanceIntervalDays: number | null;
};

export type InventoryRules = {
  defaultMaintenanceIntervalDays: number;
  expiryWarningDays: number;
  categories: CategoryRule[];
};

export type StaffAssignment = {
  staffId: number;
  name: string;
  role: string | null;
  assignedAt: string;
  releasedAt: string | null;
  badgeNumber: string | null;
};

export type ItemAssignment = {
  itemId: number;
  name: string;
  category: ItemCategory;
  quantity: number;
  assignedAt: string;
  releasedAt: string | null;
  returnCondition: ItemCondition | null;
};

export type Incident = {
  id: number;
  nature: IncidentNature;
  status: IncidentStatus;
  alarmLevel: AlarmLevel | null;
  incidentType: string;
  location: string;
  reportedBy: string;
  dateTimeReported: string;
  underControlAt: string | null;
  fireOutAt: string | null;
  resolvedAt: string | null;
  deployedStaffIds: number[];
  staff: StaffAssignment[];
  items: ItemAssignment[];
  alarmHistory: { alarmLevel: AlarmLevel; raisedAt: string }[];
  arrivedAt: string | null;
  commanderName: string | null;
  commanderOrders: { instruction: string; issuedAt: string }[];
  /** Map position; both or neither. */
  latitude: number | null;
  longitude: number | null;
};

export type Account = {
  id: number;
  email: string;
  role: UserRole;
  displayName: string | null;
  enabled: boolean;
  staffId: number | null;
  createdAt: string | null;
};

export type NewIncident = {
  nature: IncidentNature;
  alarmLevel?: AlarmLevel;
  incidentType: string;
  location: string;
  reportedBy: string;
  dateTimeReported?: string;
  staffIds?: number[];
  items?: { itemId: number; quantity: number }[];
  latitude?: number;
  longitude?: number;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Cannot reach the BumberoOS server. Is it running on port 8080?");
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try { data = JSON.parse(text); } catch { data = undefined; }
  }
  // The session ended (expired, or the account was disabled): drop the cached sign-in so the app returns to login.
  if (res.status === 401) setAccount(null);
  if (!res.ok) {
    const msg = (data as { error?: string } | undefined)?.error;
    throw new ApiError(res.status, msg ?? `Request failed (${res.status})`);
  }
  return data as T;
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  // Auth
  registered: () => request<{ registered: boolean }>("GET", "/auth/registered"),
  signin: (email: string, password: string) => request<Account>("POST", "/auth/signin", { email, password }),
  signup: (b: { email: string; password: string; displayName?: string; role?: UserRole }) =>
    request<Account>("POST", "/auth/signup", b),

  me: () => request<Account>("GET", "/auth/me"),
  signout: () => request<void>("POST", "/auth/signout"),

  // Accounts (admin only)
  listAccounts: () => request<Account[]>("GET", "/accounts"),
  /** Adds an account. The server keeps the current admin signed in. */
  createAccount: (b: { email: string; password: string; displayName?: string; role: UserRole }) =>
    request<Account>("POST", "/auth/signup", b),
  setAccountEnabled: (id: number, value: boolean) =>
    request<Account>("PATCH", `/accounts/${id}/enabled${qs({ value })}`),
  setAccountRole: (id: number, value: UserRole) =>
    request<Account>("PATCH", `/accounts/${id}/role${qs({ value })}`),
  linkAccountStaff: (id: number, staffId: number) => request<Account>("PUT", `/accounts/${id}/staff/${staffId}`),
  unlinkAccountStaff: (id: number) => request<Account>("DELETE", `/accounts/${id}/staff`),
  deleteAccount: (id: number) => request<void>("DELETE", `/accounts/${id}`),

  // Staff
  listStaff: (availability?: StaffAvailability) =>
    request<Staff[]>("GET", `/staff${qs({ availability })}`),
  createStaff: (b: Partial<Omit<Staff, "id" | "availability" | "dateJoined">>) =>
    request<Staff>("POST", "/staff", b),
  updateStaff: (id: number, b: Partial<Omit<Staff, "id" | "dateJoined">>) =>
    request<Staff>("PATCH", `/staff/${id}`, b),
  /** Soft-remove: sets employed = false and availability = UNAVAILABLE. History is kept. */
  retireStaff: (id: number) => request<Staff>("PATCH", `/staff/${id}/retire`),
  deleteStaff: (id: number) => request<void>("DELETE", `/staff/${id}`),

  // Items
  listItems: (f: { category?: ItemCategory; availableOnly?: boolean } = {}) =>
    request<Item[]>("GET", `/items${qs(f)}`),
  createItem: (b: {
    name: string; description?: string; quantity: number; condition: ItemCondition;
    category: ItemCategory; serialNumber?: string; expiryDate?: string;
  }) => request<Item>("POST", "/items", b),
  updateItem: (id: number, b: Partial<Omit<Item, "id" | "quantityDispatched" | "quantityAvailable" | "availability">>) =>
    request<Item>("PATCH", `/items/${id}`, b),
  deleteItem: (id: number) => request<void>("DELETE", `/items/${id}`),
  listAlerts: () => request<InventoryAlert[]>("GET", "/items/alerts"),
  getInventoryRules: () => request<InventoryRules>("GET", "/settings/inventory-rules"),
  saveInventoryRules: (b: InventoryRules) => request<InventoryRules>("PUT", "/settings/inventory-rules", b),

  // Incidents
  listIncidents: (f: { status?: IncidentStatus; nature?: IncidentNature } = {}) =>
    request<Incident[]>("GET", `/incidents${qs(f)}`),
  getIncident: (id: number) => request<Incident>("GET", `/incidents/${id}`),
  createIncident: (b: NewIncident) => request<Incident>("POST", "/incidents", b),
  updateIncident: (
    id: number,
    b: Partial<Pick<Incident, "nature" | "alarmLevel" | "incidentType" | "location" | "reportedBy" |
      "dateTimeReported" | "underControlAt" | "fireOutAt" | "arrivedAt" | "commanderName" | "latitude" | "longitude">>,
  ) => request<Incident>("PATCH", `/incidents/${id}`, b),
  addCommanderOrder: (id: number, instruction: string) =>
    request<Incident>("POST", `/incidents/${id}/orders`, { instruction }),
  assignStaff: (id: number, staffId: number, role?: string) =>
    request<Incident>("PUT", `/incidents/${id}/staff/${staffId}${qs({ role })}`),
  releaseStaff: (id: number, staffId: number) =>
    request<Incident>("DELETE", `/incidents/${id}/staff/${staffId}`),
  setItemQuantity: (id: number, itemId: number, quantity: number) =>
    request<Incident>("PUT", `/incidents/${id}/items/${itemId}${qs({ quantity })}`),
  releaseItem: (id: number, itemId: number) =>
    request<Incident>("DELETE", `/incidents/${id}/items/${itemId}`),
  resolveIncident: (id: number, itemReturns?: { itemId: number; condition: ItemCondition }[]) =>
    request<Incident>("POST", `/incidents/${id}/resolve`, itemReturns?.length ? { itemReturns } : undefined),
  reopenIncident: (id: number) => request<Incident>("POST", `/incidents/${id}/reopen`),
  deleteIncident: (id: number) => request<void>("DELETE", `/incidents/${id}`),
};

// ---- display helpers ----
export const label = (v: string | null | undefined) =>
  v ? v.toLowerCase().split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") : "—";

// The server sends UTC. Everything is shown in Philippine time, in the saved 12h/24h format.
// Timestamps without a zone suffix are treated as UTC, so older responses still read correctly.
const toDate = (iso: string) => new Date(/(Z|[+-]\d\d:?\d\d)$/.test(iso) ? iso : `${iso}Z`);

const fmt = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions) =>
  iso
    ? toDate(iso).toLocaleString("en-GB", { ...opts, hour12: getSettings().timeFormat === "12h", timeZone: DISPLAY_TIMEZONE })
    : "—";

export const fmtDateTime = (iso: string | null | undefined) => fmt(iso, { dateStyle: "medium", timeStyle: "short" });

/** A date-only value such as 2026-10-15. Formatted as-is, so no timezone can shift the day. */
export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" }) : "—";

export const fmtTime = (iso: string | null | undefined) => fmt(iso, { timeStyle: "medium" });

/** Today's date in Philippine time, as YYYY-MM-DD, for date-only fields such as last maintained. */
export const todayManila = () => new Date().toLocaleDateString("en-CA", { timeZone: DISPLAY_TIMEZONE });

/** Current moment as a UTC timestamp for the server, which stores zone-less LocalDateTime in UTC. */
export const nowUtc = () => new Date().toISOString().slice(0, 19);

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");