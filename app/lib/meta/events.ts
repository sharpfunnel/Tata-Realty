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

/** Meta's own constraint on custom event names — letters, digits, underscore. */
export const CUSTOM_EVENT_NAME_PATTERN = /^[A-Za-z0-9_]{1,50}$/;

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
  | {
      ok: true;
      eventId: string;
      eventName: string;
      preview: boolean;
      /** Straight from Meta's response — what makes a delivery findable in
       *  Events Manager. Absent on the credential-less dev preview path. */
      eventsReceived?: number;
      fbtraceId?: string;
    }
  | { ok: false; error: string };

/**
 * The exact JSON the server would POST, with the access token redacted, plus
 * anything about it worth flagging before it is sent. Built by the same code
 * that builds the live payload — a preview assembled separately is a preview
 * that lies.
 */
export type CapiPreview = { json: string; warnings: string[] };
