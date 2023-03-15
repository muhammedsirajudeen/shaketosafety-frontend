/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { SetStateAction, useEffect, useState } from 'react';
import type {PropsWithChildren} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SendSMS from 'react-native-sms';
import axios from 'axios';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable,
  TextInput,
  Alert,
  Image,
  FlatList
} from 'react-native';

import { NavigationContainer,useRoute } from '@react-navigation/native';
import Sound from 'react-native-sound';







import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BackgroundService from 'react-native-background-actions';
import Contacts from 'react-native-contacts';
import { PermissionsAndroid } from 'react-native';
import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes
} from "react-native-sensors";
import { map, filter } from "rxjs/operators";
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';
import GetLocation from 'react-native-get-location'


let URL="https://shaketosafety.ddns.net"

var TIMEOUT;


var SUBSCRIPTION:unknown;


setUpdateIntervalForType(SensorTypes.accelerometer, 1000);
interface details{
  number:string,
  name:string
}
let CALL_DETAILS:details={
  number:"",
  name:""
}

  const veryIntensiveTask = async () => {
    // Example of an infinite loop task
    // eventEmitter.on('greet', async () => {
    //   await BackgroundService.stop()
    // });
    
    await new Promise( async (resolve) => {
    
      SUBSCRIPTION = accelerometer.subscribe(({ x, y, z, timestamp }) =>
      {
        
        
        let speed=x+y+z
    
        if(speed>22 || speed<-22){
          console.log("speed hit")
          console.log(CALL_DETAILS)

          RNImmediatePhoneCall.immediatePhoneCall(CALL_DETAILS.number);
          GetLocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
        })
        .then(async (location) => {
            console.log(location);
            await BackgroundService.updateNotification({taskDesc: 'sending message open the app to cancel it'});
            TIMEOUT=setTimeout(async ()=>{
              await BackgroundService.updateNotification({taskDesc: 'checking your safety'}); 
              axios.post(URL,{
                number:CALL_DETAILS.number,
                longitude:location.longitude,
                latitude:location.latitude,
                name:CALL_DETAILS.name
              }).then((response)=> console.log(response.data.message)).catch(()=>console.log("error"))
            },20000)
         
            SendSMS.send(
              {
                // Message body
                body: JSON.stringify({latitude:location.latitude,longitude:location.longitude}),
                // Recipients Number
                recipients: [CALL_DETAILS.number],
                // An array of types 
                // "completed" response when using android
                successTypes: ['sent', 'queued'],
              },
              (completed, cancelled, error) => {
                if (completed) {
                  console.log('SMS Sent Completed');
                } else if (cancelled) {
                  console.log('SMS Sent Cancelled');
                } else if (error) {
                  console.log('Some error occured');
                }
              },
            );
        })
        .catch(async (error) => {
            const { code, message } = error;
            console.warn(code, message);
 
            await BackgroundService.updateNotification({taskDesc: 'sending message open the app to cancel it'}); 
            TIMEOUT=setTimeout(async ()=>{
              await BackgroundService.updateNotification({taskDesc: 'checking your safety'}); 
              axios.post(URL,{
                number:CALL_DETAILS.number,
                location:"here",
                name:CALL_DETAILS.name
              }).then((response)=> console.log(response.data.message)).catch((error)=>console.log(error))
            },20000)
           
        })


        }
      }
    );
    
    });
};
const options = {
  taskName: 'Safety Check',
  taskTitle: 'Safety mode on',
  taskDesc: 'checks the safety of your loved ones',
  taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
  },
  color: '#ff00ff',
 // See Deep Linking for more info

};

const Stack = createNativeStackNavigator();

function HomeScreen({navigation}) {
  const [allcontacts,setAllcontacts]=useState([])
  const [number,setNumber]=useState("")
  const [name,setName]=useState("")
  useEffect(()=>{
   
    async function loadContact(){
      let status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
     


      let username=await AsyncStorage.getItem("@name")
      if(!username){
        await AsyncStorage.setItem("@name",route.params.name)

      }
      username=await AsyncStorage.getItem("@name")
      CALL_DETAILS.name=username
      console.log(CALL_DETAILS)
      setName(username);
      let data= await AsyncStorage.getItem("@contactnumber");
      if(data){
        setNumber(data);
        CALL_DETAILS.number=data;
        
      }
     

    }
    loadContact();
  },[])
  const [visible,setVisible]=useState(true);
  const [contactname,setContactname]=useState("+91");
  const [emercontact,setemerContact]=useState("");

  const [submit,setSubmit]=useState("")
  const route = useRoute();
  let clicked=false



  


  async function stopHandler(){
    SUBSCRIPTION.unsubscribe();
    await BackgroundService.stop();
    clicked=false

  }
  function textHandler(text:string){
   
    setContactname(text);
  }
  async function contactHandler(){
   setNumber(contactname)
   await AsyncStorage.setItem("@contactnumber",contactname)
   CALL_DETAILS.number=contactname

  }
  async function startHandler(){
    if(clicked){
      Alert.alert("background job running")
      
    }
    else{
    await BackgroundService.start(veryIntensiveTask, options);
    await BackgroundService.updateNotification({taskDesc: 'checking your safety'}); 
    clicked=true
  }
  }
  async function stopMessage(){
     
    clearTimeout(TIMEOUT)
    await BackgroundService.updateNotification({taskDesc: 'checking your safety'});
    Alert.alert("message sending has stopped")
  }
  
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

    <Text style={styles.text}>{name ? name : route.params.name}</Text>
      <TextInput style={styles.input} onChangeText={textHandler} value={contactname} placeholder='enter name of the contact ' placeholderTextColor="black" ></TextInput>
      <Pressable  style={styles.button} onPress={contactHandler}>
          <Text style={styles.buttontext} >Set Emergency Contact</Text>
      </Pressable>
      <Pressable  style={styles.button} onPress={startHandler}>
          <Text style={styles.buttontext} >Start Safe Mode</Text>
      </Pressable>
      <Pressable  style={styles.button} onPress={stopHandler}>
          <Text style={styles.buttontext} >Stop Safe Mode</Text>
      </Pressable>
      <Pressable  style={styles.button} onPress={stopMessage}>
          <Text style={styles.buttontext} >Stop sending message</Text>
      </Pressable>
      
      <Text style={styles.contactText}>emergency contact number is {number ? number : "None"}</Text>
    </View>
  );
}



//the initial screen starts here
function LogoScreen({navigation}) :JSX.Element{
  //code that will load the screen for 5 seconds
  // setTimeout(()=>{
  //   navigation.navigate("Home")
  const [name,setName]=useState("");
  const [username,setUsername]=useState("");
  useEffect(()=>{
    async function loadusername(){
      let username=await AsyncStorage.getItem("@name");
      if(username){
        console.log(username);
        setName(username);
        setUsername(username);
   
          navigation.navigate("Home",{username});
   
      }else{
        console.log("username doesnt exist");
      };
      

    };
    loadusername();
  },[]);

  
  return(
    <View style={styles.container}>
      <Image source={require("./hand.jpg")} style={styles.image}/>
      <Text style={styles.instructions}>INSTRUCTIONS</Text>
      <FlatList style={styles.list}
          data={[
            { key: 'Enter the Person that you wanna contacts in the emergency contact input ' },
            {key:"click the set emergency contact button"},
            {key:"if you feel unsafe and u wanna quickly call the person just shake the phone"},
            {key:`if you just wanna share ur current location cancel the call and the option to message will appear`},
            {key:"if you cant even open the application and are in a extremely terrible situation we will take the"+
            "responsibility to notify your loved ones"},
            {key:"you will have to keep your app open to call or message"},
            {key:"if u cant open the app we will send your data with your current location if thats available"},
            {key:"please enter your name in the below dialogue before continuing"}

          ]}
          renderItem={({ item }) => {
            return (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 20,color:"black",marginTop:20 }}>{`\u2022 ${item.key}`}</Text>
                
              </View>
              
            );
          }}
        />
        <TextInput style={ username? styles.trueinput : styles.falseinput} placeholder='enter your real name to send to ur friends' value={name} onChangeText={(text)=>setName(text)} placeholderTextColor="white" />
        <Button title='click to continue' onPress={async ()=>{
          setUsername(name)
          await AsyncStorage.setItem("@name",name)
           navigation.navigate("Home",{name})
          }}/>
    </View>
  );
};

function App(): JSX.Element {


  return (
    <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="ShakeToSafety" component={LogoScreen}/>
      <Stack.Screen name="Home" component={HomeScreen} />
      
    </Stack.Navigator>
  </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    marginTop:20,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"white",
    color:"black",
    
  },
  clickContainer:{
    flex:1,
    marginTop:20,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"red",
  },
  text:{
    fontSize:20,
    fontWeight:"900",
    color:"black"
  },
  button:{
    borderRadius:10,
    marginTop:30,
    backgroundColor:"blueviolet",
    maxHeight:45,
    width:300,
    flex:1,
    alignItems:"center",
    justifyContent:"center",
    
  },
  buttontext:{
    color:"white",
    fontSize:15,
    fontWeight:"900",
  },
  input:{
    backgroundColor:"white",
    width:300,
    height:40,
    margin:20,
    color:"black",
  },
  contactText:{
    fontWeight:"900",
    marginTop:20,
    color:"black"
  },
  image:{
    height:200,
    width:200,
    shadowOpacity:0,
    borderRadius:100
  },
  instructions:{
    fontSize:20,
    fontWeight:"900",
    color:"black"
  },
  list:{
    margin:15
  },
  trueinput:{
    backgroundColor: 'lightgrey',
    margin: 10,
    opacity: 0,
  },
  falseinput: {
    backgroundColor: 'lightgrey',
    margin: 10,
  },
});

export default App;
