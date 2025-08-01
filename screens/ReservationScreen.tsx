import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import DateTimePicker from '@react-native-community/datetimepicker';

import { auth, db } from '../firebase';
import { Parking, RootStackParamList } from '../types'; // Asegúrate de que la ruta sea correcta
import { StackNavigationProp } from '@react-navigation/stack';

type ReservationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reservation'>;

export default function ReservationScreen() {
  const navigation = useNavigation<ReservationScreenNavigationProp>();
  const route = useRoute();
  const { parking: initialParking } = (route.params as { parking?: Parking }) || {};

  const [selectedParking, setSelectedParking] = useState<Parking | null>(initialParking || null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [manualParkingName, setManualParkingName] = useState('');

  const [loading, setLoading] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Log para ver el initialParking cuando la pantalla se monta
  useEffect(() => {
    console.log('ReservationScreen mounted. Initial parking:', initialParking);
    // Si initialParking existe, ya lo hemos establecido en el useState, no necesitamos hacer nada más aquí.
  }, []);

  // Log para ver cuándo selectedParking se actualiza
  useEffect(() => {
    console.log('Selected parking state updated in ReservationScreen:', selectedParking);
    // Si selectedParking se actualiza y es válido, limpia el campo manual
    if (selectedParking) {
      setManualParkingName(selectedParking.nombre); // Opcional: pre-rellenar el campo manual si se selecciona
    }
  }, [selectedParking]);


  const handleSearchAndSelectParking = () => {
    console.log('Navigating to ParkingSpotSelection, passing onSelectParking callback.');
    navigation.navigate('ParkingSpotSelection', {
      onSelectParking: (selectedParkingFromList: Parking) => {
        console.log('Callback received in ReservationScreen. Selected parking:', selectedParkingFromList);
        setSelectedParking(selectedParkingFromList); // Actualiza el estado en ReservationScreen
        setManualParkingName(''); // Limpia el campo manual si se seleccionó de la lista
      },
    });
  };

  const onChangeStartTime = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startTime;
    setShowStartTimePicker(Platform.OS === 'ios');
    setStartTime(currentDate);
  };

  const onChangeEndTime = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endTime;
    setShowEndTimePicker(Platform.OS === 'ios');
    setEndTime(currentDate);
  };

  const calculateTotalPrice = () => {
    if (!selectedParking?.precioHora || !startTime || !endTime) {
      return 0;
    }
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return selectedParking.precioHora * Math.ceil(durationHours);
  };

  const handleConfirmReservation = async () => {
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'Debés iniciar sesión para confirmar la reserva.');
      setLoading(false);
      return;
    }

    const finalParkingName = selectedParking ? selectedParking.nombre : manualParkingName.trim();
    const finalParkingId = selectedParking ? selectedParking.id : 'manual_entry';
    const finalParkingAddress = selectedParking ? selectedParking.direccion : 'No especificada';

    if (!finalParkingName) {
      Alert.alert('Campo requerido', 'Debes seleccionar o ingresar el nombre del estacionamiento.');
      setLoading(false);
      return;
    }
    if (!vehiclePlate.trim() || !startTime || !endTime) {
      Alert.alert('Campos incompletos', 'Por favor, completá la matrícula, hora de inicio y hora de fin.');
      setLoading(false);
      return;
    }
    if (startTime.getTime() >= endTime.getTime()) {
      Alert.alert('Error de Horario', 'La hora de fin debe ser posterior a la hora de inicio.');
      setLoading(false);
      return;
    }

    if (selectedParking && selectedParking.espaciosDisponibles !== undefined && selectedParking.espaciosDisponibles <= 0) {
      Alert.alert('No Disponible', 'Lo sentimos, este estacionamiento no tiene espacios disponibles en este momento.');
      setLoading(false);
      return;
    }

    try {
      const reservaId = uuidv4();
      const totalPrice = calculateTotalPrice();

      await setDoc(doc(db, 'reservas', reservaId), {
        usuarioId: user.uid,
        lugarEstacionamientoId: finalParkingId,
        nombreEstacionamiento: finalParkingName,
        direccionEstacionamiento: finalParkingAddress,
        matriculaVehiculo: vehiclePlate.toUpperCase(),
        horaInicio: Timestamp.fromDate(startTime),
        horaFin: Timestamp.fromDate(endTime),
        notasAdicionales: additionalNotes,
        fechaCreacion: Timestamp.now(),
        estado: 'pendiente',
        precioTotal: totalPrice,
      });

      Alert.alert(
        'Reserva Confirmada',
        `¡Tu reserva en ${finalParkingName} ha sido registrada!\nMatrícula: ${vehiclePlate}\nDe ${startTime.toLocaleTimeString()} a ${endTime.toLocaleTimeString()}\nTotal: $${totalPrice.toFixed(2)}`,
        [
          {
            text: 'Cerrar',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
          {
            text: 'Ver Ruta',
            onPress: () => {
              if (selectedParking && selectedParking.lat && selectedParking.lng) {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedParking.lat},${selectedParking.lng}&travelmode=driving`;
                Linking.openURL(url);
              } else {
                Alert.alert('Error de Ruta', 'No se pudo obtener la ubicación del estacionamiento para generar la ruta.');
              }
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Error al confirmar la reserva:', error);
      Alert.alert('Error de Reserva', `No se pudo completar la reserva: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || (initialParking && !selectedParking)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Cargando detalles del estacionamiento o esperando selección...</Text>
      </View>
    );
  }

  const totalPrice = calculateTotalPrice();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Confirmar Reserva</Text>

        {selectedParking ? (
          <View style={styles.parkingDetailsCard}>
            <Text style={styles.cardTitle}>{selectedParking.nombre}</Text>
            <Text style={styles.cardText}>{selectedParking.direccion}</Text>
            {selectedParking.precioHora !== undefined && <Text style={styles.cardText}>Precio por hora: ${selectedParking.precioHora.toFixed(2)}</Text>}
            {selectedParking.espaciosDisponibles !== undefined && <Text style={styles.cardText}>Espacios disponibles: {selectedParking.espaciosDisponibles}</Text>}
          </View>
        ) : (
          <View style={styles.parkingSelectionContainer}>
            <Text style={styles.sectionTitle}>Selecciona un Estacionamiento</Text>
            <TouchableOpacity style={styles.selectParkingButton} onPress={handleSearchAndSelectParking}>
              <Text style={styles.selectParkingButtonText}>Buscar/Seleccionar Estacionamiento</Text>
            </TouchableOpacity>
            <Text style={styles.orText}>O</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el nombre del estacionamiento (manual)"
              value={manualParkingName}
              onChangeText={setManualParkingName}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Tus Datos de Reserva</Text>
        <TextInput
          style={styles.input}
          placeholder="Matrícula del vehículo (ej. ABC 123)"
          value={vehiclePlate}
          onChangeText={setVehiclePlate}
          autoCapitalize="characters"
        />

        <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={styles.timePickerButton}>
          <Text style={styles.timePickerButtonText}>Hora de inicio: {startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Seleccionar'}</Text>
        </TouchableOpacity>
        {showStartTimePicker && (
          <DateTimePicker
            testID="startTimePicker"
            value={startTime || new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onChangeStartTime}
          />
        )}

        <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.timePickerButton}>
          <Text style={styles.timePickerButtonText}>Hora de fin: {endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Seleccionar'}</Text>
        </TouchableOpacity>
        {showEndTimePicker && (
          <DateTimePicker
            testID="endTimePicker"
            value={endTime || new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onChangeEndTime}
          />
        )}

        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Notas adicionales (ej. 'Mi auto es un sedan')"
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />

        {totalPrice > 0 && (
          <Text style={styles.totalPriceText}>Precio Estimado: ${totalPrice.toFixed(2)}</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleConfirmReservation} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirmar Reserva</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 26,
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#555',
  },
  parkingDetailsCard: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E90FF',
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  totalPriceText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    color: '#28a745',
  },
  button: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  parkingSelectionContainer: {
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#add8e6',
    marginBottom: 30,
    alignItems: 'center',
  },
  selectParkingButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  selectParkingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 16,
    marginVertical: 10,
    color: '#666',
  },
});
