// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !nombre) {
      Alert.alert('Campos incompletos', 'Por favor completá todos los campos.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar datos en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: nombre,
        email: user.email,
        creadoEn: new Date(),
      });

      Alert.alert('¡Registro exitoso!', 'Ahora podés iniciar sesión.');
      navigation.goBack(); // Volver al login
    } catch (error: any) {
      Alert.alert('Error al registrarse', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <TextInput
        placeholder="Nombre completo"
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.registerText}>¿Ya tenés cuenta? Iniciá sesión</Text>
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1E90FF',
    padding: 15,
    borderRadius: 6,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  registerText: {
    textAlign: 'center',
    color: '#1E90FF',
  },
});