import RNMapView, { Marker, Callout, Circle, MapViewProps } from "react-native-maps";
import { Platform } from "react-native";

// Re-export the native MapView with all its components
export { Marker, Callout, Circle };

export interface NativeMapViewProps extends MapViewProps {
  /** Region to display */
  region?: MapViewProps["region"];
  /** Callback when region changes */
  onRegionChange?: MapViewProps["onRegionChange"];
  /** Callback when region change completes */
  onRegionChangeComplete?: MapViewProps["onRegionChangeComplete"];
  /** Show user location */
  showsUserLocation?: boolean;
  /** Show my location button */
  showsMyLocationButton?: boolean;
  /** Follow user location */
  followsUserLocation?: boolean;
  /** Enable loading indicator */
  loadingEnabled?: boolean;
}

/**
 * Native MapView component for iOS and Android
 * Uses react-native-maps which provides native map performance
 */
export default function MapView(props: NativeMapViewProps) {
  return <RNMapView {...props} />;
}