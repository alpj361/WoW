import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (scannedUserId: string) => Promise<void>;
  eventTitle: string;
}

export function QRScanner({ visible, onClose, onScan, eventTitle }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setScanning(true);
      setLastScanned(null);
    }
  }, [visible]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning || processing) return;

    // Prevent duplicate scans
    if (lastScanned === data) return;
    setLastScanned(data);
    setScanning(false);
    setProcessing(true);

    try {
      // Validate QR format: should be "WOW-USER-{uuid}"
      if (!data.startsWith('WOW-USER-')) {
        Alert.alert('QR Inválido', 'Este QR no es un código de usuario válido.');
        resetScanner();
        return;
      }

      // Extract user ID
      const scannedUserId = data.replace('WOW-USER-', '');

      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(scannedUserId)) {
        Alert.alert('QR Inválido', 'El formato del código de usuario no es válido.');
        resetScanner();
        return;
      }

      // Call the onScan callback
      await onScan(scannedUserId);
      
      // Show success and close
      Alert.alert(
        '¡Asistencia Registrada!',
        'El usuario ha sido marcado como asistido.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar la asistencia.');
      resetScanner();
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setTimeout(() => {
      setScanning(true);
      setLastScanned(null);
    }, 2000);
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={onClose} />
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
            <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
            <Text style={styles.permissionText}>
              Necesitamos acceso a la cámara para escanear códigos QR.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Permitir Acceso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#000', 'transparent']} style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear Asistente</Text>
          <Text style={styles.headerSubtitle}>{eventTitle}</Text>
        </LinearGradient>

        {/* Camera View */}
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Scanning Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {processing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={styles.processingText}>Verificando...</Text>
                </View>
              )}
            </View>
          </View>
        </CameraView>

        {/* Instructions */}
        <LinearGradient colors={['transparent', '#000']} style={styles.footer}>
          <View style={styles.instructionContainer}>
            <Ionicons name="qr-code-outline" size={32} color="#8B5CF6" />
            <Text style={styles.instructionTitle}>Escanea el QR del Usuario</Text>
            <Text style={styles.instructionText}>
              Coloca el código QR personal del asistente dentro del marco
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    margin: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 4,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#8B5CF6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  processingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  instructionContainer: {
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
