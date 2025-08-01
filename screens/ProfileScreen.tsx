import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({ nombre: '', email: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          // Asegúrate de que el ID del documento en 'usuarios' sea el UID del usuario
          const docRef = doc(db, 'usuarios', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              nombre: data.nombre || '',
              email: data.email || currentUser.email,
            });
          } else {
            // Si el documento del perfil no existe, usa solo el email de auth
            setUserData({ nombre: '', email: currentUser.email || '' }); 
          }
        } catch (error) {
          console.error("Error al obtener la información del usuario:", error);
          Alert.alert('Error', 'No se pudo obtener la información del usuario.');
        }
      } else {
        // Si no hay usuario autenticado, limpiar los datos del perfil
        setUserData({ nombre: '', email: '' });
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Reinicia la pila de navegación para ir a la pantalla de Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // NUEVA FUNCIÓN para navegar al historial de reservas
  const handleViewReservationsHistory = () => {
    // Asegúrate de que 'ReservationsHistory' sea el nombre de la ruta
    // que has configurado en tu navegador (ej. Stack.Screen name="ReservationsHistory")
    navigation.navigate('ReservationsHistory'); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil de Usuario</Text>
      <Text style={styles.info}>Nombre: {userData.nombre || 'N/A'}</Text> {/* Muestra N/A si no hay nombre */}
      <Text style={styles.info}>Correo: {userData.email || 'N/A'}</Text> {/* Muestra N/A si no hay correo */}

      {/* AQUÍ ES DONDE DEBES COLOCAR EL BOTÓN PARA EL HISTORIAL DE RESERVAS */}
      <TouchableOpacity style={styles.historyButton} onPress={handleViewReservationsHistory}>
        <Text style={styles.buttonText}>Historial de Reservas</Text>
      </TouchableOpacity>

      {/* El botón de Cerrar Sesión se coloca después del nuevo botón */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333', // Color más oscuro para el título
  },
  info: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    color: '#555', // Color para la información
  },
  // NUEVOS ESTILOS PARA EL BOTÓN DE HISTORIAL
  historyButton: {
    backgroundColor: '#1E90FF', // Un color diferente para distinguirlo
    padding: 15,
    borderRadius: 8,
    marginTop: 20, // Espacio superior para separarlo de la información del perfil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  // ESTILOS EXISTENTES, RENOMBRADOS PARA MAYOR CLARIDAD
  logoutButton: { 
    backgroundColor: '#FF6347', // Rojo para cerrar sesión
    padding: 15,
    borderRadius: 8,
    marginTop: 15, // Espacio entre el botón de historial y este botón
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
});