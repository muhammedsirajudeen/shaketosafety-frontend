/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes
} from "react-native-sensors";
import { map, filter } from "rxjs/operators";

setUpdateIntervalForType(SensorTypes.accelerometer, 400);

const subscription = accelerometer
  .pipe(map(({ x, y, z }) => x + y + z), filter(speed => speed > 20))
  .subscribe(
    speed => console.log(`You moved your phone with ${speed}`),
    error => {
      console.log("The sensor is not available");
    }
  );

const Stack = createNativeStackNavigator();

function HomeScreen({navigation}) {
  const [visible,setVisible]=useState(true)
  setTimeout(()=>{
    setVisible(false)
  },4000)
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>LOGO HERE {visible ? "logo": "logo"} </Text>
    </View>
  );
}


function App(): JSX.Element {


  return (
    <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      
    </Stack.Navigator>
  </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
