import type { LaplandApi } from './preload';

declare global {
  interface Window {
    api: LaplandApi;
  }
}
