import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
export default function MapPreview({latitude,longitude}:{latitude:number;longitude:number}) {
 return <View style={s.wrap}><MapView style={StyleSheet.absoluteFill} initialRegion={{latitude,longitude,latitudeDelta:0.035,longitudeDelta:0.035}} showsUserLocation>
 <Marker coordinate={{latitude,longitude}} title="Pickup location"/></MapView><View style={s.label}><Text style={{fontWeight:"700"}}>Pickup area</Text></View></View>;
}
const s=StyleSheet.create({wrap:{height:260,overflow:"hidden",borderRadius:18},label:{position:"absolute",bottom:10,left:10,backgroundColor:"white",padding:8,borderRadius:8}});
