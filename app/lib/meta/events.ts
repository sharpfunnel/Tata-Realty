/**
 * Shared between the server-side CAPI client and the admin's Send modal.
 * Deliberately free of `server-only` and of any Node imports so the client
 * component can use it — capi.ts holds everything that must stay on the server.
 */

export const CAPI_EVENT_TYPES = [
  { value: "Purchase", label: "Purchase", needsValue: true },
  { value: "Lead", label: "Lead", needsValue: false },
  { value: "Subscribe", label: "Subscribe", needsValue: true },
  { value: "CompleteRegistration", label: "Registration", needsValue: false },
  { value: "StartTrial", label: "Start Trial", needsValue: true },
  { value: "Custom", label: "Custom", needsValue: false },
] as const;

export type CapiEventType = (typeof CAPI_EVENT_TYPES)[number]["value"];

/** Literal tuple for `z.enum` — `.map()` alone would widen these to `string`. */
export const CAPI_EVENT_VALUES = CAPI_EVENT_TYPES.map(
  (type) => type.value,
) as unknown as [CapiEventType, ...CapiEventType[]];

export type ManualCapiOptions = {
  eventType: CapiEventType;
  /** Required when eventType is "Custom" — the free-text event name. */
  customEventName?: string;
  value?: number;
  currency?: string;
  /** Order/reference id, used as the CAPI event_id for Pixel dedup. */
  orderId?: string;
};

export type ManualCapiResult =
  | { ok: true; eventId: string; eventName: string; preview: boolean }
  | { ok: false; error: string };
