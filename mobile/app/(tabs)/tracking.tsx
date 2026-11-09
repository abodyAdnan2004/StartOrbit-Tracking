import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform, PermissionsAndroid, Switch } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useCustomerStore } from '@/store/customerStore';
import { Customer } from '@/types/customer';

const LOCATION_TASK_NAME = 'background-location-task';

export default function TrackingScreen() {
  const { token, user } = useAuthStore();
  const { isTracking, startTracking, stopTracking, currentLocation, lastUpdate, error, queueLength } = useLocationStore();
  const { customers, loadCustomers } = useCustomerStore();
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (token) {
      loadCustomers();
      checkPermissions();
    }
  }, [token, loadCustomers]);

  const checkPermissions = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(newStatus);
    }

    if (Platform.OS === 'android') {
      const bgStatus = await Location.getBackgroundPermissionsAsync();
      if (bgStatus.status !== 'granted') {
        await Location.requestBackgroundPermissionsAsync();
      }
    }
  };

  const handleToggleTracking = async () => {
    if (!isTracking) {
      if (permissionStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to start tracking');
        return;
      }

      if (customers.length > 0) {
        setShowCustomerPicker(true);
      } else {
        startTracking(token!);
      }
    } else {
      stopTracking();
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    startTracking(token!, customer.id);
    setShowCustomerPicker(false);
  };

  useEffect(() => {
    if (currentLocation) {
      setMapRegion({
        ...mapRegion,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation]);

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return '#3B82F6';
    if (accuracy <= 10) return '#10B981';
    if (accuracy <= 30) return '#F59E0B';
    return '#EF4444';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[
            styles.statusDot,
            isTracking ? styles.statusDotActive : styles.statusDotInactive
          ]} />
          <Text style={styles.statusText}>{isTracking ? 'TRACKING' : 'STOPPED'}</Text>
        </View>

        <View style={styles.statusItem}>
          <Ionicons name="timer-outline" size={16} color="#6B7280" style={{ marginRight: 4 }} />
          <Text style={styles.statusText}>
            {lastUpdate ? `Updated: ${formatTime(lastUpdate)}` : 'No updates yet'}
          </Text>
        </View>

        {queueLength > 0 && (
          <View style={styles.statusItem}>
            <Ionicons name="cloud-upload-outline" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
            <Text style={styles.statusText}>Queue: {queueLength}</Text>
          </View>
        )}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={isTracking}
        loadingEnabled
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description={`Accuracy: ${currentLocation.accuracy?.toFixed(1) || 'N/A'}m`}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>Current Position</Text>
                <Text style={styles.calloutDetail}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.calloutDetail}>
                  Accuracy: {currentLocation.accuracy?.toFixed(1) || 'N/A'}m
                </Text>
                {currentLocation.speed && (
                  <Text style={styles.calloutDetail}>
                    Speed: {currentLocation.speed.toFixed(1)} m/s
                  </Text>
                )}
                <Text style={styles.calloutTime}>
                  {formatTime(currentLocation.timestamp)}
                </Text>
              </View>
            </Callout>
          </Marker>
        )}

        {/* Accuracy Circle */}
        {currentLocation && currentLocation.accuracy && (
          <MapView.Circle
            center={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            radius={currentLocation.accuracy}
            strokeWidth={0}
            fillColor={getAccuracyColor(currentLocation.accuracy) + '33'}
            strokeColor={getAccuracyColor(currentLocation.accuracy) + '80'}
          />
        )}

        {/* Customer Markers */}
        {customers.map(customer => (
          customer.latitude && customer.longitude && (
            <Marker
              key={customer.id}
              coordinate={{
                latitude: customer.latitude,
                longitude: customer.longitude,
              }}
              title={customer.name}
              description={customer.address || ''}
              pinColor="#10B981"
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{customer.name}</Text>
                  {customer.address && (
                    <Text style={styles.calloutDetail}>{customer.address}</Text>
                  )}
                  <Text style={styles.calloutDetail}>
                    {customer.phone || 'No phone'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          )
        ))}
      </MapView>

      {/* Current Location Info Card */}
      {currentLocation && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Latitude</Text>
              <Text style={styles.infoValue}>{currentLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Longitude</Text>
              <Text style={styles.infoValue}>{currentLocation.longitude.toFixed(6)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Accuracy</Text>
              <Text style={[styles.infoValue, { color: getAccuracyColor(currentLocation.accuracy) }]}>
                {currentLocation.accuracy.toFixed(1)}m
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Speed</Text>
              <Text style={styles.infoValue}>
                {currentLocation.speed ? currentLocation.speed.toFixed(1) + ' m/s' : 'N/A'}
              </Text>
            </View>
          </View>
          {selectedCustomer && (
            <View style={styles.customerTag}>
              <Ionicons name="person-outline" size={14} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.customerTagText}>Tracking for: {selectedCustomer.name}</Text>
            </View>
          )}
        </View>
      )}

      {/* Toggle Button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isTracking ? styles.toggleButtonActive : styles.toggleButtonInactive
        ]}
        onPress={handleToggleTracking}
        disabled={permissionStatus !== 'granted' && !isTracking}
        activeOpacity={0.9}
      >
        {isTracking ? (
          <>
            <Ionicons name="stop-circle-outline" size={28} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.toggleButtonText}>Stop Tracking</Text>
          </>
        ) : (
          <>
            <Ionicons name="play-circle-outline" size={28} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.toggleButtonText}>Start Tracking</Text>
          </>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Customer Picker Modal */}
      <Modal visible={showCustomerPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay} onTouchStart={() => setShowCustomerPicker(false)}>
          <View style={styles.modalContainer} onTouchStart={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={customers}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.customerOption}
                  onPress={() => handleCustomerSelect(item)}
                >
                  <View style={styles.optionAvatar}>
                    <Text style={styles.optionAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionMeta}>{item.address || 'No address'}</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.emptyOption}>
                  <Text style={styles.emptyOptionText}>No customers assigned</Text>
                  <Text style={styles.emptyOptionSubtext}>Add customers first to track visits</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={[styles.customerOption, styles.noCustomerOption]}
              onPress={() => { startTracking(token!); setShowCustomerPicker(false); }}
            >
              <Ionicons name="location-outline" size={24} color="#6B7280" style={{ marginRight: 12 }} />
              <Text style={styles.optionName}>Track without customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statusBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  statusDotInactive: {
    backgroundColor: '#9CA3AF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  map: {
    flex: 1,
  },
  callout: {
    padding: 8,
    minWidth: 200,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  calloutDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  calloutTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  customerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  customerTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#EF4444',
  },
  toggleButtonInactive: {
    backgroundColor: '#3B82F6',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  errorBanner: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  noCustomerOption: {
    borderBottomWidth: 0,
    backgroundColor: '#F0F9FF',
  },
  optionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  optionMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyOption: {
    padding: 40,
    alignItems: 'center',
  },
  emptyOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptyOptionSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

import { TouchableOpacity, FlatList } from 'react-native';