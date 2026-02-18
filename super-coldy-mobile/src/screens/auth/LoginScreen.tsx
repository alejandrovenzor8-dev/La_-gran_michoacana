/**
 * Pantalla de login
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    clearError();
    const success = await login(username.trim(), password);

    if (!success) {
      Alert.alert('Error de autenticación', error || 'Usuario o contraseña incorrectos');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.logo}>
              🍦
            </Text>
            <Text variant="headlineLarge" style={styles.title}>
              La Michoacana
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Panel de Administración
            </Text>
          </View>

          {/* Formulario */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Usuario"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                disabled={isLoading}
                left={<TextInput.Icon icon="account" />}
                style={styles.input}
              />

              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                disabled={isLoading}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                onSubmitEditing={handleLogin}
              />

              {error && (
                <Text variant="bodySmall" style={styles.errorText}>
                  ⚠️ {error}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              {isLoading && (
                <ActivityIndicator
                  animating={true}
                  size="large"
                  style={styles.loader}
                />
              )}
            </Card.Content>
          </Card>

          {/* Footer */}
          <Text variant="bodySmall" style={styles.footer}>
            Solo para administradores
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
  },
  card: {
    elevation: 4,
    backgroundColor: '#ffffff',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  loader: {
    marginTop: 16,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    color: '#6b7280',
  },
});
