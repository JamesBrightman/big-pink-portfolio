export type AnalyticsEventValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type AnalyticsEventParams = Record<string, AnalyticsEventValue>;

declare global {
  interface Window {
    dataLayer: Array<Record<string, AnalyticsEventValue>>;
  }
}

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export function pushAnalyticsEvent(
  event: string,
  params: AnalyticsEventParams = {},
) {
  if (typeof window === "undefined" || !gtmId) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...params,
  });
}

export function trackPageView(path: string) {
  pushAnalyticsEvent("page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
