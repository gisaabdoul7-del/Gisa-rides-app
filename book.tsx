import {useEffect,useState} from "react";
import {SafeAreaView,View,Text,Pressable,TextInput,StyleSheet,Alert,ScrollView} from "react-native";
import * as Location from "expo-location";
import MapPreview from "../components/MapPreview";
import {calculateFare,RideType} from "../lib/fare";
import {supabase,isSupabaseConfigured} from "../lib/supabase";
export default function Book(){
 const [coords,setCoords]=useState({latitude:-1.9441,longitude:30.0619});
 const [kind,setKind]=useState<RideType>("moto"); const [pickup,setPickup]=useState("My current location");
 const [destination,setDestination]=useState(""); const [km,setKm]=useState("5"); const [busy,setBusy]=useState(false);
 useEffect(()=>{(async()=>{try{const p=await Location.requestForegroundPermissionsAsync();if(p.status==="granted"){const x=await Location.getCurrentPositionAsync({});setCoords({latitude:x.coords.latitude,longitude:x.coords.longitude});}}catch{}})();},[]);
 const distance=Math.max(0,Number(km)||0);
 async function requestRide(){
  if(!destination.trim()){Alert.alert("Add destination","Enter where you want to go.");return;}
  if(!isSupabaseConfigured||!supabase){Alert.alert("Demo request prepared",`Ride: ${kind.toUpperCase()}\nPickup: ${pickup}\nDestination: ${destination}\nEstimated fare: ${calculateFare(kind,distance).toLocaleString()} RWF\n\nConfigure Supabase and add authentication to send live requests.`);return;}
  setBusy(true);
  try{const {data:{user}}=await supabase.auth.getUser();if(!user){Alert.alert("Sign in required","Authentication UI and profile creation must be added before live requests.");return;}
   const {error}=await supabase.from("rides").insert({rider_id:user.id,ride_type:kind,pickup_lat:coords.latitude,pickup_lng:coords.longitude,pickup_address:pickup,destination_address:destination,distance_km:distance,fare_rwf:calculateFare(kind,distance),status:"requested"});
   if(error)throw error; Alert.alert("Request saved","Driver matching and realtime updates still need to be enabled.");
  }catch(e:any){Alert.alert("Could not request ride",e?.message??"Please try again.");}finally{setBusy(false);}
 }
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.body}><Text style={s.title}>Book a ride</Text><MapPreview {...coords}/>
 <Text style={s.label}>Pickup point</Text><TextInput value={pickup} onChangeText={setPickup} style={s.input}/>
 <Text style={s.label}>Destination</Text><TextInput value={destination} onChangeText={setDestination} placeholder="e.g. Kigali Convention Centre" style={s.input}/>
 <Text style={s.label}>Ride type</Text><View style={s.row}>{(["moto","car"] as RideType[]).map(x=><Pressable key={x} onPress={()=>setKind(x)} style={[s.choice,kind===x&&s.active]}><Text style={kind===x?s.white:s.black}>{x==="moto"?"🏍 Moto":"🚗 Car"}</Text></Pressable>)}</View>
 <Text style={s.label}>Estimated distance (km, demo)</Text><TextInput value={km} onChangeText={setKm} keyboardType="decimal-pad" style={s.input}/>
 <View style={s.farebox}><Text style={s.farelabel}>Estimated fare</Text><Text style={s.fare}>{calculateFare(kind,distance).toLocaleString()} RWF</Text><Text style={s.hint}>Temporary default: 500 RWF/km for both types.</Text></View>
 <Pressable disabled={busy} onPress={requestRide} style={s.primary}><Text style={s.white}>{busy?"Submitting…":"Request ride"}</Text></Pressable>
 <Text style={s.hint}>Distance is entered manually; Google Places/Directions is not connected yet.</Text></ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#fff"},body:{padding:18,gap:8},title:{fontSize:30,fontWeight:"900",marginBottom:8},label:{fontWeight:"700",marginTop:10},input:{borderWidth:1,borderColor:"#ddd",borderRadius:11,padding:13,fontSize:16},row:{flexDirection:"row",gap:10},choice:{flex:1,borderWidth:1,borderColor:"#ddd",padding:15,borderRadius:12,alignItems:"center"},active:{backgroundColor:"#151515",borderColor:"#151515"},white:{color:"#fff",fontWeight:"800"},black:{color:"#111",fontWeight:"800"},farebox:{padding:16,backgroundColor:"#f4f4f4",borderRadius:14,marginTop:10},farelabel:{color:"#666"},fare:{fontSize:30,fontWeight:"900",marginTop:4},hint:{fontSize:12,color:"#666",marginTop:8},primary:{backgroundColor:"#151515",padding:17,borderRadius:12,alignItems:"center",marginTop:8}});
