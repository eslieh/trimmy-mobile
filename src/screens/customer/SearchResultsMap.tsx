import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BusinessSummary } from '../../types/discovery';

interface SearchResultsMapProps {
  results: BusinessSummary[];
  center: { lat: number; lng: number };
  onSelectBusiness: (businessId: string) => void;
}

export function SearchResultsMap({ results, center, onSelectBusiness }: SearchResultsMapProps) {
  const region: Region = {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <MapView style={styles.map} initialRegion={region}>
      {results.map((business) => (
        <Marker
          key={business.businessId}
          coordinate={{ latitude: business.lat, longitude: business.lng }}
          onPress={() => onSelectBusiness(business.businessId)}
        >
          <View style={styles.markerPill}>
            <Text style={styles.markerText}>KSh {business.startingPrice.amount}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    ...shadows.card,
  },
  markerText: {
    ...typography.label,
    color: colors.text.primary,
  },
});
