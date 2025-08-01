import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parkingSpots, setParkingSpots] = useState<any[]>([]); // Este estado se llenará desde Firebase
  const navigation = useNavigation<any>();

  // Botón Perfil en el header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
          <Ionicons name="person-circle-outline" size={28} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Obtener ubicación actual
  useEffect(() => {
    (async () => {
      console.log("Intentando solicitar permisos de ubicación..."); // Log de depuración
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        console.log("Permiso de ubicación denegado."); // Log de depuración
        return;
      }

      console.log("Permiso de ubicación concedido. Intentando obtener ubicación actual..."); // Log de depuración
      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        console.log("Ubicación obtenida:", loc.coords.latitude, loc.coords.longitude); // Log de depuración
      } catch (err: any) {
        // Captura errores específicos de getCurrentPositionAsync
        setErrorMsg(`Error al obtener ubicación: ${err.message}`);
        console.error("Error al obtener ubicación:", err); // Log de error detallado
      }
    })();
  }, []);

  // Cargar estacionamientos desde Firebase
  useEffect(() => {
    const fetchParkings = async () => {
      try {
        console.log("Intentando cargar estacionamientos desde Firebase...");
        const snapshot = await getDocs(collection(db, 'estacionamientos')); // Asegúrate de que sea 'estacionamientos' (plural)

        if (snapshot.empty) {
          console.log("La colección 'estacionamientos' está vacía o no se encontraron documentos.");
          Alert.alert('Info', 'No se encontraron estacionamientos en la base de datos.');
          setParkingSpots([]);
          return;
        }

        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          // Asegúrate de que lat y lng sean números en Firestore
          if (typeof docData.lat !== 'number' || typeof docData.lng !== 'number') {
            console.warn(`Advertencia: Lat/Lng de estacionamiento ${doc.id} no son números. Datos:`, docData);
          }
          return {
            id: doc.id,
            ...docData,
          };
        });
        
        console.log("Datos de estacionamientos cargados:", data);
        setParkingSpots(data); // <-- ¡Aquí se actualiza el estado!
      } catch (error: any) { // Especificar tipo 'any' para el error
        console.error("Error al cargar estacionamientos desde Firebase:", error);
        Alert.alert('Error al cargar estacionamientos', `Verifica tu conexión y las reglas de Firebase. Detalle: ${error.message}`);
      }
    };
    fetchParkings();
  }, []);

  // Mostrar mensaje si no hay ubicación aún
  if (!location) {
    console.log("Location es null. Mostrando pantalla de carga. ErrorMsg:", errorMsg); // Log de depuración
    return (
      <View style={styles.center}>
        <Text>Cargando ubicación...</Text>
        {errorMsg && <Text>{errorMsg}</Text>}
      </View>
    );
  }

  // MODIFICACIÓN CLAVE AQUÍ: Navegar a ReservationScreen y pasar el objeto parking
  const handleSelectParking = (parking: any) => {
    navigation.navigate('Reservation', { parking: parking });
  };

  // Función para manejar el botón flotante "Reservar"
  const handleFabPress = () => {
    // Navega a la pantalla de Reservas sin pasar un objeto 'parking'.
    // ReservationScreen manejará este caso mostrando la interfaz de selección/entrada manual.
    navigation.navigate('Reservation'); 
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1, // Aumentado para una vista más amplia
          longitudeDelta: 0.1, // Aumentado para una vista más amplia
        }}
      >
        {/* Marcador para la ubicación actual del usuario */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Estás aquí"
          pinColor="blue"
        />

        {/* Marcadores desde Firestore */}
        {parkingSpots.map((parking) => ( // <-- ¡DEBE SER parkingSpots.map!
          <Marker
            key={parking.id}
            coordinate={{ latitude: parseFloat(parking.lat), longitude: parseFloat(parking.lng) }}
            title={parking.nombre}
            description={parking.direccion}
            onPress={() => handleSelectParking(parking)} // Llama a la función modificada
          />
        ))}
      </MapView>

      {/* Botón flotante para navegar a la pantalla de Reservas */}
      <TouchableOpacity
        onPress={handleFabPress} // Llama a la nueva función para el botón flotante
        style={styles.fab}
      >
        <Text style={styles.fabText}>Reservar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#1E90FF',
    width: 90,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
