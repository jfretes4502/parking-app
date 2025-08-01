// navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReservationScreen from '../screens/ReservationScreen';
import ReservationsHistoryScreen from '../screens/ReservationsHistoryScreen';
import ParkingSpotSelectionScreen from '../screens/ParkingSpotSelectionScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" id={undefined}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Estacionamientos cercanos' }} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Reservation" component={ReservationScreen} options={{ title: 'Reservacion' }} />
              <Stack.Screen name="ReservationsHistory" component={ReservationsHistoryScreen} options={{ title: 'Historial de Reservas' }} />
              <Stack.Screen name="ParkingSpotSelection" component={ParkingSpotSelectionScreen} options={{ title: 'Seleccionar Estacionamiento' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}