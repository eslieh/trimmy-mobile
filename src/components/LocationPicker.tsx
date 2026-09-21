import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button } from './Button';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { BusinessLocation } from '../types/business';

interface LocationPickerProps {
  label: string;
  value: BusinessLocation | null;
  onChange: (location: BusinessLocation) => void;
}

// Nairobi CBD — a reasonable default center until the owner moves the pin
// or uses their current location.
const DEFAULT_REGION: Region = {
  latitude: -1.2921,
  longitude: 36.8219,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// "Move the map under a fixed center pin" pattern, rather than a draggable
// marker — simpler to get right on both platforms.
export function LocationPicker({ label, value, onChange }: LocationPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [address, setAddress] = useState(value?.address ?? '');
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const resolveAddress = async (latitude: number, longitude: number) => {
    setIsResolvingAddress(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const resolved = place
        ? [place.street, place.district ?? place.city, place.region].filter(Boolean).join(', ')
        : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setAddress(resolved);
      onChange({ address: resolved, lat: latitude, lng: longitude });
    } catch {
      const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setAddress(fallback);
      onChange({ address: fallback, lat: latitude, lng: longitude });
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleRegionChangeComplete = (region: Region) => {
    resolveAddress(region.latitude, region.longitude);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const position = await Location.getCurrentPositionAsync({});
      const region: Region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(region, 300);
      await resolveAddress(region.latitude, region.longitude);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={value ? { ...DEFAULT_REGION, latitude: value.lat, longitude: value.lng } : DEFAULT_REGION}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
        <View pointerEvents="none" style={styles.pin}>
          <View style={styles.pinDot} />
        </View>
      </View>

      <View style={styles.addressRow}>
        {isResolvingAddress ? (
          <ActivityIndicator size="small" color={colors.text.secondary} />
        ) : (
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Move the map to set your business location'}
          </Text>
        )}
      </View>

      <Button
        label={isLocating ? 'Locating…' : 'Use current location'}
        variant="secondary"
        disabled={isLocating}
        onPress={handleUseCurrentLocation}
        style={styles.currentLocationButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  mapWrapper: {
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -14,
    marginLeft: -7,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand.pink,
    borderWidth: 2,
    borderColor: colors.white,
  },
  addressRow: {
    minHeight: 36,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  addressText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  currentLocationButton: {
    marginTop: spacing.sm,
  },
});
