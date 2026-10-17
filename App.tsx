import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { requestRide, connectRideSocket, Ride, RideType, Coordinate } from './src/services/api';

const GREEN = '#0BAA45';
const DARK = '#10351F';
const KIGALI: Region = { latitude: -1.9441, longitude: 30.0619, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function App() {
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [rideType, setRideType] = useState<RideType>('moto');
  const [ride, setRide] = useState<Ride | null>(null);
  const [region, setRegion] = useState<Region>(KIGALI);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Please allow location access so Gisa Rides can find your pickup point.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setLocation(c); setRegion({ ...c, latitudeDelta: 0.03, longitudeDelta: 0.03 });
    })();
  }, []);

  useEffect(() => {
    if (!ride?.id) return;
    const socket = connectRideSocket(ride.id, setRide);
    return () => { socket.disconnect(); };
  }, [ride?.id]);

  const estimatedDistanceKm = useMemo(() => {
    if (!location || !destination) return 0;
    const R = 6371;
    const dLat = (destination.latitude - location.latitude) * Math.PI / 180;
    const dLon = (destination.longitude - location.longitude) * Math.PI / 180;
    const lat1 = location.latitude * Math.PI / 180;
    const lat2 = destination.latitude * Math.PI / 180;
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }, [location, destination]);
  const pricePerKm = rideType === 'moto' ? 500 : 2500;
  const estimatedFare = useMemo(() => Math.round(estimatedDistanceKm * pricePerKm), [estimatedDistanceKm, pricePerKm]);

  const request = async () => {
    if (!location || !destination) {
      Alert.alert('Choose destination', 'Tap the map to select where you want to go.');
      return;
    }
    try {
      const created = await requestRide({
        passengerId: 'demo-passenger', pickup: location, destination, type: rideType,
      });
      setRide(created);
    } catch {
      Alert.alert('Connection problem', 'Start the Gisa Rides server and set EXPO_PUBLIC_API_URL before requesting a real ride.');
    }
  };

  const cancel = () => setRide(null);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}><View><Text style={styles.logo}>GISA</Text><Text style={styles.subtitle}>Rides • Kigali</Text></View><View style={styles.avatar}><Text>G</Text></View></View>
      <MapView style={styles.map} region={region} showsUserLocation onPress={(e) => setDestination(e.nativeEvent.coordinate)}>
        {location && <Marker coordinate={location} title="Pickup" pinColor={GREEN} />}
        {destination && <Marker coordinate={destination} title="Destination" />}
        {ride?.driver?.location && <Marker coordinate={ride.driver.location} title={ride.driver.name} pinColor="#111" />}
        {location && destination && <Polyline coordinates={[location, destination]} strokeWidth={4} strokeColor={GREEN} />}
      </MapView>
      <View style={styles.sheet}>
        {ride ? <RideCard ride={ride} onCancel={cancel} /> : <>
          <Text style={styles.title}>Where are you going?</Text>
          <Text style={styles.hint}>Tap a point on the map to set your destination. Moto: RWF 500/km • Car: RWF 2,500/km.</Text>
          <View style={styles.types}>
            {(['moto','car'] as RideType[]).map(t => <TouchableOpacity key={t} style={[styles.type, rideType===t && styles.typeActive]} onPress={() => setRideType(t)}><Text style={styles.typeEmoji}>{t==='moto'?'🏍️':'🚗'}</Text><View><Text style={styles.typeName}>{t==='moto'?'Moto':'Car'}</Text><Text style={styles.typePrice}>RWF 500 / km</Text></View></TouchableOpacity>)}
          </View>
          <TouchableOpacity style={styles.button} onPress={request}><Text style={styles.buttonText}>{estimatedDistanceKm > 0 ? `REQUEST RIDE • RWF ${estimatedFare.toLocaleString()}` : 'SELECT DESTINATION'}</Text></TouchableOpacity>
        </>}
      </View>
    </SafeAreaView>
  );
}

function RideCard({ ride, onCancel }: { ride: Ride; onCancel: () => void }) {
  return <View><Text style={styles.title}>{ride.status === 'searching' ? 'Finding your Captain…' : ride.status === 'accepted' ? 'Captain is on the way' : 'Ride status: ' + ride.status}</Text>
    {ride.driver && <View style={styles.driver}><View style={styles.driverAvatar}><Text>🚕</Text></View><View style={{flex:1}}><Text style={styles.driverName}>{ride.driver.name}</Text><Text>{ride.driver.vehicle}</Text></View><View><Text style={styles.fare}>RWF {ride.fare.toLocaleString()}</Text><Text style={styles.typePrice}>{ride.distanceKm} km • {ride.type==='moto'?'RWF 500/km':'RWF 2,500/km'}</Text></View></View>}
    <TouchableOpacity style={styles.cancel} onPress={onCancel}><Text>Cancel ride</Text></TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#fff'}, header:{height:72,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, logo:{fontSize:26,fontWeight:'900',color:GREEN,letterSpacing:1},subtitle:{fontSize:12,color:'#617267'},avatar:{width:40,height:40,borderRadius:20,backgroundColor:'#E8F7ED',alignItems:'center',justifyContent:'center'},map:{flex:1},sheet:{backgroundColor:'#fff',padding:20,borderTopLeftRadius:24,borderTopRightRadius:24,shadowColor:'#000',shadowOpacity:.1,shadowRadius:12,elevation:8},title:{fontSize:22,fontWeight:'800',color:DARK},hint:{color:'#68756D',marginTop:5,marginBottom:14},types:{flexDirection:'row',gap:10},type:{flex:1,borderWidth:1,borderColor:'#D9E3DC',borderRadius:14,padding:12,flexDirection:'row',alignItems:'center',gap:10},typeActive:{borderColor:GREEN,backgroundColor:'#F0FBF4'},typeEmoji:{fontSize:28},typeName:{fontSize:16,fontWeight:'700'},typePrice:{fontSize:12,color:'#68756D',marginTop:2},button:{marginTop:14,backgroundColor:GREEN,padding:17,borderRadius:14,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'900'},driver:{marginTop:14,flexDirection:'row',alignItems:'center',gap:12},driverAvatar:{width:48,height:48,borderRadius:24,backgroundColor:'#EEF5F0',alignItems:'center',justifyContent:'center'},driverName:{fontSize:17,fontWeight:'800'},fare:{fontWeight:'900'},cancel:{marginTop:14,borderWidth:1,borderColor:'#E2E7E3',padding:14,borderRadius:12,alignItems:'center'}
});
