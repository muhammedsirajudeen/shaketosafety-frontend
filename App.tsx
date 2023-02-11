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






var SUBSCRIPTION;


setUpdateIntervalForType(SensorTypes.accelerometer, 1000);

let CALL_DETAILS={
  number:""
}

  const veryIntensiveTask = async () => {
    // Example of an infinite loop task
    // eventEmitter.on('greet', async () => {
    //   await BackgroundService.stop()
    // });
    
    await new Promise( async (resolve) => {
    
      SUBSCRIPTION = accelerometer.subscribe(({ x, y, z, timestamp }) =>
      {
        
        
        let speed=x+y+x
        console.log(speed)
        if(speed>20 || speed<-20){
          console.log("speed hit")
          console.log(CALL_DETAILS)

          RNImmediatePhoneCall.immediatePhoneCall(CALL_DETAILS.number);
          GetLocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
        })
        .then(location => {
            console.log(location);
            axios.post("http://192.168.78.119:3000/",{
              number:CALL_DETAILS.number,
              longitude:location.longitude,
              latitude:location.latitude
            }).then((response)=> console.log(response.data.message)).catch(()=>console.log("error"))
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
        .catch(error => {
            const { code, message } = error;
            console.warn(code, message);
            axios.post("http://192.168.78.119:3000/",{
              number:CALL_DETAILS.number,
              location:"here"
            }).then((response)=> console.log(response.data.message))
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
      let status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE)
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
      status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS)
      await BackgroundService.start(veryIntensiveTask, options);
      await BackgroundService.updateNotification({taskDesc: 'checking your safety'}); 
      let username=await AsyncStorage.getItem("@name")
      setName(username)
      let data=await AsyncStorage.getItem("@contact")
      if(data){

        setemerContact(data)
        let contactArray=await Contacts.getAll()
        let flag=0
        contactArray.forEach((contacts)=>{
          if(contacts.displayName===data){
            console.log("found")
            console.log(contacts.phoneNumbers[0].number)
            setNumber(contacts.phoneNumbers[0].number)
            flag=1
            CALL_DETAILS.number=contacts.phoneNumbers[0].number
          }
        })
      }
    }
    loadContact()
  },[])
  const [visible,setVisible]=useState(true)
  const [contactname,setContactname]=useState("")
  const [emercontact,setemerContact]=useState("")

  const [submit,setSubmit]=useState("")
  const route = useRoute();



  


  async function stopHandler(){
    SUBSCRIPTION.unsubscribe()
    await BackgroundService.stop()

  }
  function textHandler(text){
   
    setContactname(text)
  }
  async function contactHandler(){
    console.log(contactname)
    setContactname("")
    let contactArray=await Contacts.getAll()
    let flag=0
    contactArray.forEach((contacts)=>{
      if(contacts.displayName===contactname){
        console.log("found")
        console.log(contacts.phoneNumbers[0].number)
        setNumber(contacts.phoneNumbers[0].number)
        CALL_DETAILS.number=contacts.phoneNumbers[0].number
        flag=1
      }
    })
   
    if(flag){
      try{
        await AsyncStorage.setItem('@contact', contactname)
        }catch(e){
          console.log(e)
        }
        
        setemerContact(contactname)
    }
    else{
      Alert.alert("contact not found")
    }

  }
  
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

    <Text style={styles.text}>{name? name : route.params.name}</Text>
      <TextInput style={styles.input} onChangeText={textHandler} value={contactname} placeholder='enter name of the contact ' placeholderTextColor="black" ></TextInput>
      <Pressable  style={styles.button} onPress={contactHandler}>
          <Text style={styles.buttontext} >Set Emergency Contact</Text>
      </Pressable>

      <Pressable  style={styles.button} onPress={stopHandler}>
          <Text style={styles.buttontext} >Stop Safe Mode</Text>
      </Pressable>
      <Text style={styles.contactText}> Your Emergency Contact is {emercontact ? emercontact : "None"}</Text>
      <Text style={styles.contactText}>number is {number ? number : "None"}</Text>
    </View>
  );
}

function LogoScreen({navigation}) :JSX.Element{
  //code that will load the screen for 5 seconds
  // setTimeout(()=>{
  //   navigation.navigate("Home")

  const [name,setName]=useState("")
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
        <TextInput style={styles.falseinput} placeholder='enter your real name to send to ur friends' value={name} onChangeText={(text)=>setName(text)} placeholderTextColor="white" />
        <Button title='click to continue' onPress={async ()=>{
           navigation.navigate("Home",{name})
          }}/>
    </View>
  )
}

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
    backgroundColor:"lightgrey",
    margin:10,
    opacity:100
  },
  falseinput:{
    backgroundColor:"lightgrey",
    margin:10,
  }

});

export default App;
