import { Platform } from "react-native";

/**
 * Platform-specific MapView entry point
 * Metro will resolve this file, and we dynamically import the platform-specific implementation
 */

// Native implementation (iOS/Android)
const NativeMapView = Platform.OS !== "web"
  ? require("./MapView.native").default
  : null;

// Web implementation (Leaflet)
const WebMapView = Platform.OS === "web"
  ? require("./MapView.web").default
  : null;

// Export the appropriate implementation
export const MapView = Platform.OS === "web" ? WebMapView : NativeMapView;

// Re-export components from the appropriate platform
export const Marker = Platform.OS === "web"
  ? require("./MapView.web").Marker
  : require("./MapView.native").Marker;

export const Callout = Platform.OS === "web"
  ? require("./MapView.web").Callout
  : require("./MapView.native").Callout;

export const Circle = Platform.OS === "web"
  ? require("./MapView.web").Circle
  : require("./MapView.native").Circle;

export default MapView;