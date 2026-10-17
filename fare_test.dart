import 'package:flutter_test/flutter_test.dart';
import 'package:gisa_rides/fare.dart';

void main() {
  group('Gisa Rides fare estimate', () {
    test('moto is 500 FRW per estimated kilometre', () {
      expect(estimateFareFrw(serviceType: 'moto', distanceKm: 5), 2500);
    });

    test('car rate matches the previously supplied 10 km example', () {
      expect(estimateFareFrw(serviceType: 'car', distanceKm: 10), 25000);
    });

    test('rounds a partial FRW up and rejects invalid distances', () {
      expect(estimateFareFrw(serviceType: 'moto', distanceKm: 1.001), 501);
      expect(estimateFareFrw(serviceType: 'moto', distanceKm: 0), 0);
      expect(estimateFareFrw(serviceType: 'moto', distanceKm: double.nan), 0);
    });

    test('computes Kigali straight-line distance to a positive value', () {
      final distance = straightLineKm(
        startLat: -1.9441,
        startLng: 30.0619,
        endLat: -1.95,
        endLng: 30.08,
      );
      expect(distance, greaterThan(0));
      expect(distance, lessThan(5));
    });
  });
}
