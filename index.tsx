import { router } from "expo-router";
import { SafeAreaView,View,Text,Pressable,StyleSheet } from "react-native";
export default function Home(){return <SafeAreaView style={s.safe}><View style={s.body}>
<Text style={s.brand}>Gisa Rides</Text><Text style={s.tag}>Your ride around Kigali.</Text><Text style={s.note}>MVP demo · Moto and car booking</Text>
<Pressable style={s.primary} onPress={()=>router.push("/book")}><Text style={s.primaryText}>Book a ride</Text></Pressable>
<Pressable style={s.secondary} onPress={()=>router.push("/driver")}><Text style={s.secondaryText}>Driver demo</Text></Pressable>
<Text style={s.disclaimer}>Demo build: ride requests are not yet sent to real drivers.</Text>
</View></SafeAreaView>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#fff"},body:{flex:1,justifyContent:"center",padding:26},brand:{fontSize:42,fontWeight:"900",color:"#151515"},tag:{fontSize:20,marginTop:8},note:{color:"#666",marginTop:18,marginBottom:34},primary:{backgroundColor:"#151515",padding:18,borderRadius:14,alignItems:"center"},primaryText:{color:"#fff",fontWeight:"800",fontSize:18},secondary:{borderWidth:1,borderColor:"#ddd",padding:18,borderRadius:14,alignItems:"center",marginTop:12},secondaryText:{fontWeight:"800",fontSize:18},disclaimer:{marginTop:24,color:"#777",fontSize:12}});
