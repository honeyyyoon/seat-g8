import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { chainColors, colors, radius, spacing } from '@/constants/theme';
import { listTheaters } from '@/data/layouts';
import { useCurrentLocation } from '@/lib/location';

const SEOUL = { latitude: 37.5503, longitude: 126.9971, latitudeDelta: 0.28, longitudeDelta: 0.28 };

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const theaters = listTheaters().filter((t) => t.lat !== null && t.lng !== null);
  const location = useCurrentLocation();

  useEffect(() => {
    location.request();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={SEOUL}
        showsUserLocation={location.state.status === 'ready'}
        showsPointsOfInterests={false}>
        {theaters.map((theater) => (
          <Marker
            key={theater.id}
            testID={`marker-${theater.id}`}
            coordinate={{ latitude: theater.lat!, longitude: theater.lng! }}
            title={theater.name}
            description="자세히 보기 ›"
            pinColor={chainColors[theater.chain] ?? colors.accent}
            onCalloutPress={() => router.push({ pathname: '/theaters/[theaterId]', params: { theaterId: theater.id } })}
          />
        ))}
      </MapView>

      {location.state.status === 'denied' && (
        <View style={[styles.banner, { bottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.bannerText}>위치 권한이 꺼져 있어서 내 위치는 보이지 않아요.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { position: 'absolute', left: spacing.lg, right: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  bannerText: { fontSize: 14, color: colors.muted },
});
