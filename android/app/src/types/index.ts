// app/src/types/index.ts

    import { StackNavigationProp } from '@react-navigation/stack';
    import { RouteProp } from '@react-navigation/native';

    // Definir la interfaz para el objeto de estacionamiento
    export interface Parking {
      id: string;
      nombre: string;
      lat: number; // ¡Crucial para el mapa y la navegación!
      lng: number; // ¡Crucial para el mapa y la navegación!
      direccion: string;
      precioHora?: number;
      totalEspacios?: number;
      espaciosDisponibles?: number;
    }

    // Define los parámetros para cada pantalla en tu Stack Navigator
    export type RootStackParamList = {
      Login: undefined;
      Register: undefined;
      Map: undefined;
      Profile: undefined;
      Reservation: { parking?: Parking };
      ReservationsHistory: undefined;
      ParkingSpotSelection: { onSelectParking: (parking: Parking) => void };
    };

    // Define los tipos de prop para la navegación y ruta de cada pantalla
    export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
    export type ReservationScreenRouteProp = RouteProp<RootStackParamList, 'Reservation'>;
    export type ParkingSpotSelectionScreenRouteProp = RouteProp<RootStackParamList, 'ParkingSpotSelection'>;
    export type AppNavigationProp = StackNavigationProp<RootStackParamList>; // Para el navegador principal si lo necesitas
    