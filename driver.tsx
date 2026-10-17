import {useState} from "react";
import {SafeAreaView,View,Text,Pressable,StyleSheet,Alert} from "react-native";
export default function Driver(){const [online,setOnline]=useState(false);return <SafeAreaView style={s.safe}><View style={s.body}>
<Text style={s.title}>Driver mode</Text><Text style={s.sub}>MVP driver screen</Text>
<View style={s.card}><Text style={s.cardTitle}>Availability</Text><Text>{online?"You appear online in this demo.":"You are offline."}</Text>
<Pressable style={s.button} onPress={()=>{setOnline(!online);if(!online)Alert.alert("Demo mode","This does not publish location or notify riders yet.");}}><Text style={s.white}>{online?"Go Offline":"Go Online"}</Text></Pressable></View>
<View style={s.card}><Text style={s.cardTitle}>Ride requests</Text><Text style={s.sub}>No live requests are connected yet.</Text><Text>Next: matching, accept/decline, navigation and trip status.</Text></View>
<Text style={s.foot}>Driver identity and vehicle must be verified before public launch.</Text></View></SafeAreaView>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#fff"},body:{padding:22,gap:14},title:{fontSize:32,fontWeight:"900"},sub:{color:"#666",marginTop:4},card:{borderWidth:1,borderColor:"#ddd",borderRadius:16,padding:18,gap:10},cardTitle:{fontSize:20,fontWeight:"800"},button:{backgroundColor:"#151515",padding:15,borderRadius:12,alignItems:"center",marginTop:6},white:{color:"#fff",fontWeight:"800"},foot:{color:"#666",fontSize:12,marginTop:8}});
