import { useEffect, useRef, useState } from "react";
import {
	MapContainer,
	TileLayer,
	CircleMarker,
	Marker as LeafletMarker,
	Popup,
	Circle as LeafletCircle,
	useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { View, ViewStyle } from "react-native";
import L, { type Map } from "leaflet";

// Fix for Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface WebMapViewProps {
	/** Region to display - { latitude, longitude, latitudeDelta, longitudeDelta } */
	region?: {
		latitude: number;
		longitude: number;
		latitudeDelta: number;
		longitudeDelta: number;
	};
	/** Callback when region changes */
	onRegionChange?: (region: {
		latitude: number;
		longitude: number;
		latitudeDelta: number;
		longitudeDelta: number;
	}) => void;
	/** Callback when region change completes */
	onRegionChangeComplete?: (region: {
		latitude: number;
		longitude: number;
		latitudeDelta: number;
		longitudeDelta: number;
	}) => void;
	/** Style for the map container */
	style?: ViewStyle;
	/** Children components (Marker, Circle, etc.) */
	children?: React.ReactNode;
}

/**
 * Convert react-native-maps region to Leaflet bounds/center/zoom
 */
function regionToLeaflet(region: WebMapViewProps["region"]) {
	if (!region) return null;

	// Convert latitudeDelta/longitudeDelta to zoom level
	// This is an approximation
	const zoom = Math.round(
		Math.log2(360 / Math.max(region.latitudeDelta, region.longitudeDelta)),
	);

	return {
		center: [region.latitude, region.longitude] as [number, number],
		zoom: Math.max(1, Math.min(18, zoom)),
	};
}

/**
 * Convert React Native ViewStyle to CSS-compatible style object
 */
function convertStyleToCSS(style?: ViewStyle): React.CSSProperties {
	if (!style) return { width: "100%", height: "100%" };

	const cssStyle: React.CSSProperties = {
		width: "100%",
		height: "100%",
	};

	// Handle common React Native style properties
	if (typeof style === "object" && !Array.isArray(style)) {
		Object.entries(style).forEach(([key, value]) => {
			if (value === undefined || value === null) return;

			// Convert camelCase to kebab-case for CSS
			const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();

			// Handle specific React Native properties
			switch (key) {
				case "flex":
					if (value === 1) {
						cssStyle.flex = 1;
						cssStyle.minHeight = 0;
					}
					break;
				case "width":
				case "height":
				case "minWidth":
				case "maxWidth":
				case "minHeight":
				case "maxHeight":
				case "top":
				case "left":
				case "right":
				case "bottom":
				case "margin":
				case "marginTop":
				case "marginBottom":
				case "marginLeft":
				case "marginRight":
				case "padding":
				case "paddingTop":
				case "paddingBottom":
				case "paddingLeft":
				case "paddingRight":
				case "borderRadius":
				case "borderWidth":
				case "opacity":
					cssStyle[cssKey as any] =
						typeof value === "number" ? `${value}px` : value;
					break;
				case "backgroundColor":
					cssStyle.backgroundColor = value as string;
					break;
				default:
					// Pass through other properties as-is
					cssStyle[cssKey as any] = value;
			}
		});
	}

	return cssStyle;
}

/**
 * Leaflet Map component wrapper
 */
function LeafletMapInner({
	region,
	onRegionChange,
	onRegionChangeComplete,
	children,
	style,
}: WebMapViewProps) {
	const mapRef = useRef<Map | null>(null);
	const [leafletRegion, setLeafletRegion] = useState(regionToLeaflet(region));

	// Handle map move events
	const MapEvents = () => {
		const map = useMapEvents({
			moveend() {
				const center = map.getCenter();
				const zoom = map.getZoom();

				// Convert back to react-native-maps region format
				const latDelta = 360 / Math.pow(2, zoom);
				const lngDelta = 360 / Math.pow(2, zoom);

				const newRegion = {
					latitude: center.lat,
					longitude: center.lng,
					latitudeDelta: latDelta,
					longitudeDelta: lngDelta,
				};

				if (onRegionChange) {
					onRegionChange(newRegion);
				}
				if (onRegionChangeComplete) {
					onRegionChangeComplete(newRegion);
				}
				setLeafletRegion({ center: [center.lat, center.lng], zoom });
			},
		});
		return null;
	};

	// Update leaflet region when props change
	useEffect(() => {
		if (region && mapRef.current) {
			const newLeafletRegion = regionToLeaflet(region);
			if (newLeafletRegion) {
				mapRef.current.setView(
					newLeafletRegion.center,
					newLeafletRegion.zoom,
				);
				setLeafletRegion(newLeafletRegion);
			}
		}
	}, [region]);

	if (!leafletRegion) {
		return <View style={[style, { backgroundColor: "#E5E7EB" }]} />;
	}

	const cssStyle = convertStyleToCSS(style);

	return (
		<MapContainer
			ref={mapRef}
			center={leafletRegion.center}
			zoom={leafletRegion.zoom}
			style={cssStyle}
			zoomControl={true}
			scrollWheelZoom={true}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<MapEvents />
			{children}
		</MapContainer>
	);
}

/**
 * Compatible Marker component
 * Maps react-native-maps props to react-leaflet props
 */
export function Marker({
	coordinate,
	title,
	description,
	pinColor,
	children,
	...props
}: {
	coordinate: { latitude: number; longitude: number };
	title?: string;
	description?: string;
	pinColor?: string;
	children?: React.ReactNode;
	[key: string]: any;
}) {
	const popupContent = useRef(null);

	if (children) {
		popupContent.current = children;
	}

	// Always use a custom divIcon to avoid issues with default Leaflet marker icons
	const markerIcon = L.divIcon({
		className: "custom-marker",
		html: `<div style="background-color: ${pinColor || "#007AFF"}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
		iconSize: [20, 20],
		iconAnchor: [10, 10],
	});

	return (
		<LeafletMarker
			position={[coordinate.latitude, coordinate.longitude]}
			icon={markerIcon}
			{...props}
		>
			{(title || description || children) && (
				<Popup
					content={
						popupContent.current || (
							<div>
								{title && (
									<div style={{ fontWeight: "bold" }}>
										{title}
									</div>
								)}
								{description && <div>{description}</div>}
							</div>
						)
					}
				/>
			)}
		</LeafletMarker>
	);
}

/**
 * Compatible Callout component (alias for Popup)
 */
export function Callout({
	children,
	...props
}: {
	children: React.ReactNode;
	[key: string]: any;
}) {
	return <Popup {...props}>{children}</Popup>;
}

/**
 * Compatible Circle component
 * Maps react-native-maps props to react-leaflet props
 */
export function Circle({
	center,
	radius,
	strokeWidth,
	fillColor,
	strokeColor,
	...props
}: {
	center: { latitude: number; longitude: number };
	radius: number;
	strokeWidth?: number;
	fillColor?: string;
	strokeColor?: string;
	[key: string]: any;
}) {
	// Convert hex color with alpha to rgba
	const parseColor = (color: string | undefined) => {
		if (!color) return undefined;
		if (color.startsWith("#")) {
			const hex = color.slice(1);
			if (hex.length === 8) {
				const r = parseInt(hex.slice(0, 2), 16);
				const g = parseInt(hex.slice(2, 4), 16);
				const b = parseInt(hex.slice(4, 6), 16);
				const a = parseInt(hex.slice(6, 8), 16) / 255;
				return `rgba(${r}, ${g}, ${b}, ${a})`;
			} else if (hex.length === 6) {
				const r = parseInt(hex.slice(0, 2), 16);
				const g = parseInt(hex.slice(2, 4), 16);
				const b = parseInt(hex.slice(4, 6), 16);
				return `rgb(${r}, ${g}, ${b})`;
			}
		}
		return color;
	};

	return (
		<LeafletCircle
			center={[center.latitude, center.longitude]}
			radius={radius}
			weight={strokeWidth || 1}
			fillColor={parseColor(fillColor)}
			color={parseColor(strokeColor)}
			fillOpacity={fillColor ? 0.2 : 0}
			{...props}
		/>
	);
}

/**
 * Web MapView component using react-leaflet
 * Provides a compatible API with react-native-maps
 */
export default function WebMapView(props: WebMapViewProps) {
	return <LeafletMapInner {...props} />;
}
