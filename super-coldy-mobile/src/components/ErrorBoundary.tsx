import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('❌ Error caught by boundary:', error);
    console.error('Component stack:', info.componentStack);

    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Fallback UI por defecto para errores
 */
function DefaultErrorFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.content}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={64}
              color={theme.colors.error}
              style={styles.icon}
            />

            <Text variant="headlineSmall" style={styles.title}>
              Algo salió mal
            </Text>

            <Text variant="bodyMedium" style={styles.message}>
              Lo sentimos, ocurrió un error inesperado.
            </Text>

            {__DEV__ && (
              <View style={styles.errorDetails}>
                <Text variant="labelSmall" style={styles.errorLabel}>
                  Detalles del error:
                </Text>
                <Text
                  variant="bodySmall"
                  style={styles.errorText}
                  selectable
                >
                  {error.message}
                </Text>
              </View>
            )}

            <View style={styles.buttons}>
              <Button
                mode="contained"
                onPress={onRetry}
                icon="refresh"
                style={styles.button}
              >
                Reintentar
              </Button>

              <Button
                mode="outlined"
                onPress={() => {
                  // En un app completo, aquí irías a la pantalla principal
                  console.log('Navegar a inicio');
                }}
                icon="home"
                style={styles.button}
              >
                Ir al Inicio
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  card: {
    width: '100%',
    elevation: 4,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  errorLabel: {
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  errorText: {
    color: '#78350f',
    fontFamily: 'monospace',
  },
  buttons: {
    width: '100%',
    gap: 8,
  },
  button: {
    width: '100%',
  },
});

/**
 * Hook para manejar errores en componentes funcionales
 */
export function useErrorHandler(
  error: Error | null,
  onError?: (error: Error) => void
) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      setHasError(true);
      console.error('❌ Error capturado:', error);
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  const resetError = () => {
    setHasError(false);
  };

  return { hasError, resetError };
}

// Re-export para convenience
export default ErrorBoundary;
