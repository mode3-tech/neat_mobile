import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

export function openInAppBrowser(url: string) {
  openBrowserAsync(url, {
    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
  }).catch(() => {});
}
