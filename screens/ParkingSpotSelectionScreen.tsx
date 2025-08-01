import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate de la ruta correcta

import { ParkingSpotSelectionScreenRouteProp, Parking } from '../types'; // Asegúrate de que la ruta sea correcta

export default function ParkingSpotSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute<ParkingSpotSelectionScreenRouteProp>();

  const [parkingSpots, setParkingSpots] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  // Log para ver los parámetros de ruta cuando la pantalla se monta
  useEffect(() => {
    console.log('ParkingSpotSelectionScreen mounted. Route params:', route.params);
  }, [route.params]);

  // Cargar estacionamientos desde Firebase
  useEffect(() => {
    const fetchParkings = async () => {
      try {
        console.log("Cargando estacionamientos desde Firebase en ParkingSpotSelectionScreen...");
        const snapshot = await getDocs(collection(db, 'estacionamientos'));
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
          } as Parking;
        });
        console.log("Estacionamientos cargados:", data);
        setParkingSpots(data);
        setLoading(false);
      } catch (error: any) {
        console.error("Error al cargar estacionamientos en ParkingSpotSelectionScreen:", error);
        setErrorMsg(`Error al cargar estacionamientos: ${error.message}`);
        setLoading(false);
        Alert.alert('Error', 'No se pudieron cargar los estacionamientos.');
      }
    };
    fetchParkings();
  }, []);

  // Función para manejar la selección de un estacionamiento
  const handleSelect = (parking: Parking) => {
    console.log('Estacionamiento seleccionado en ParkingSpotSelectionScreen:', parking);
    if (route.params?.onSelectParking) {
      console.log('Llamando a onSelectParking callback con:', parking);
      route.params.onSelectParking(parking);
    } else {
      console.warn('onSelectParking callback no encontrado en route.params.');
      Alert.alert('Advertencia', 'No se pudo pasar la selección del estacionamiento. Por favor, intente de nuevo.');
    }
    navigation.goBack(); // Vuelve a ReservationScreen
  };

  const filteredParkingSpots = parkingSpots.filter(parking =>
    parking.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    parking.direccion.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: { item: Parking }) => (
    <TouchableOpacity style={styles.parkingCard} onPress={() => handleSelect(item)}>
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardText}>{item.direccion}</Text>
      {item.precioHora !== undefined && <Text style={styles.cardText}>Precio/hora: ${item.precioHora.toFixed(2)}</Text>}
      {item.espaciosDisponibles !== undefined && <Text style={styles.cardText}>Disponibles: {item.espaciosDisponibles}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Cargando estacionamientos...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar estacionamiento por nombre o dirección..."
        value={searchText}
        onChangeText={setSearchText}
      />
      {filteredParkingSpots.length === 0 && !loading && (
        <Text style={styles.emptyText}>No se encontraron estacionamientos.</Text>
      )}
      <FlatList
        data={filteredParkingSpots}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  searchInput: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  parkingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});