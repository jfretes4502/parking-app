import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Asegúrate de que la ruta a firebase.ts sea correcta

// Interfaz para la estructura de una reserva
interface Reservation {
  id: string;
  usuarioId: string;
  lugarEstacionamientoId: string;
  nombreEstacionamiento: string;
  direccionEstacionamiento: string;
  matriculaVehiculo: string;
  horaInicio: Timestamp; // Usamos Timestamp de Firestore
  horaFin: Timestamp;    // Usamos Timestamp de Firestore
  fechaCreacion: Timestamp;
  estado: string;
  precioTotal: number;
  notasAdicionales?: string; // Opcional
}

export default function ReservationsHistoryScreen() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError('Debes iniciar sesión para ver tu historial de reservas.');
      setLoading(false);
      return;
    }

    // Crea una consulta para obtener las reservas del usuario actual, ordenadas por fecha de creación descendente
    const q = query(
      collection(db, 'reservas'),
      where('usuarioId', '==', currentUser.uid),
      orderBy('fechaCreacion', 'desc') // Ordena las reservas de la más reciente a la más antigua
    );

    // Suscríbete a los cambios en tiempo real de la colección 'reservas'
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReservations: Reservation[] = [];
      snapshot.forEach((doc) => {
        fetchedReservations.push({
          id: doc.id,
          ...doc.data() as Omit<Reservation, 'id'> // Castea los datos para que coincidan con la interfaz
        });
      });
      setReservations(fetchedReservations);
      setLoading(false);
      setError(null); // Limpia cualquier error previo si la carga fue exitosa
    }, (err) => {
      console.error("Error al cargar historial de reservas:", err);
      setError('Error al cargar tu historial de reservas. Intenta de nuevo más tarde.');
      setLoading(false);
      Alert.alert('Error', 'No se pudo cargar el historial de reservas. Verifica tu conexión y las reglas de Firebase.');
    });

    // Desuscribirse del listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []); // El array de dependencias vacío asegura que se ejecute una sola vez al montar

  const renderReservationItem = ({ item }: { item: Reservation }) => {
    // Convierte Timestamps a objetos Date para facilitar la visualización
    const startTimeDate = item.horaInicio.toDate();
    const endTimeDate = item.horaFin.toDate();
    const creationDate = item.fechaCreacion.toDate();

    return (
      <View style={styles.reservationCard}>
        <Text style={styles.cardTitle}>{item.nombreEstacionamiento}</Text>
        <Text style={styles.cardText}>Dirección: {item.direccionEstacionamiento}</Text>
        <Text style={styles.cardText}>Matrícula: {item.matriculaVehiculo}</Text>
        <Text style={styles.cardText}>Inicio: {startTimeDate.toLocaleString()}</Text>
        <Text style={styles.cardText}>Fin: {endTimeDate.toLocaleString()}</Text>
        <Text style={styles.cardText}>Precio Total: ${item.precioTotal.toFixed(2)}</Text>
        <Text style={styles.cardText}>Estado: {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}</Text>
        {item.notasAdicionales && <Text style={styles.cardText}>Notas: {item.notasAdicionales}</Text>}
        <Text style={styles.cardDate}>Reservado el: {creationDate.toLocaleDateString()} {creationDate.toLocaleTimeString()}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Cargando historial de reservas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (reservations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No tienes reservas registradas aún.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Mi Historial de Reservas</Text>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={renderReservationItem}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Un fondo suave
    paddingTop: 20,
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
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20, // Espacio al final de la lista
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderLeftWidth: 5, // Un borde para darle un toque
    borderLeftColor: '#1E90FF',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'right',
  },
});