import { Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button } from './Button';
import { LocationPinIcon } from './icons/LocationPinIcon';
import { colors, radii, spacing, typography } from '../theme';

interface EmbeddedLocationMapProps {
  address: string;
  lat: number;
  lng: number;
}

// Address row + a small non-interactive map + "Get directions" — shared by
// BookingDetailScreen's Location card and Business Profile's Other tab.
// Deliberately has no heading/card wrapper of its own since the two callers
// use different heading conventions; each wraps this in its own.
export function EmbeddedLocationMap({ address, lat, lng }: EmbeddedLocationMapProps) {
  const handleGetDirections = () => {
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`).catch(() => {});
  };

  return (
    <View>
      <View style={styles.locationRow}>
        <LocationPinIcon size={14} color={colors.text.secondary} />
        <Text style={styles.locationText}>{address}</Text>
      </View>
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          pointerEvents="none"
          initialRegion={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker coordinate={{ latitude: lat, longitude: lng }} />
        </MapView>
      </View>
      <Button label="Get directions" variant="secondary" onPress={handleGetDirections} />
    </View>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  mapWrapper: {
    height: 140,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  map: {
    flex: 1,
  },
});
