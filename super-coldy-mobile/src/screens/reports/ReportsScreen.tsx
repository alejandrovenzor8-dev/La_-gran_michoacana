import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">📊 Reportes</Text>
      <Text style={styles.subtitle}>Próximamente: Gráficas y estadísticas detalladas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subtitle: {
    marginTop: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});
