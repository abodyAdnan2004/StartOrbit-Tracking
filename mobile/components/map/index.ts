/**
 * Platform-specific MapView export
 * Uses native MapView on iOS/Android (MapView.native.tsx) and Leaflet on web (MapView.web.tsx)
 * Metro will automatically resolve the correct file based on platform
 */

export { default as MapView, Marker, Callout, Circle } from "./MapView.tsx";