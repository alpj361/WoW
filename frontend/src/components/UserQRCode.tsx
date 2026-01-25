import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';

interface UserQRCodeProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

export function UserQRCode({ visible, onClose, userId, userName }: UserQRCodeProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      fetchOrCreateQR();
    }
  }, [visible, userId]);

  const fetchOrCreateQR = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch existing QR code
      const { data, error: fetchError } = await supabase
        .from('user_qr_codes')
        .select('qr_code_data')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // If not found, create one
        if (fetchError.code === 'PGRST116') {
          const newQrData = `WOW-USER-${userId}`;
          const { error: insertError } = await supabase
            .from('user_qr_codes')
            .insert({
              user_id: userId,
              qr_code_data: newQrData,
            });

          if (insertError) throw insertError;
          setQrData(newQrData);
        } else {
          throw fetchError;
        }
      } else {
        setQrData(data.qr_code_data);
      }
    } catch (err: any) {
      console.error('Error fetching QR code:', err);
      setError('No se pudo cargar tu código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mi código QR de asistencia WOW: ${qrData}`,
        title: 'Código QR de Asistencia',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mi Código QR</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Generando código...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchOrCreateQR}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : qrData ? (
            <>
              {/* QR Code Display */}
              <View style={styles.qrContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  style={styles.qrGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={qrData}
                      size={220}
                      backgroundColor="white"
                      color="black"
                      logoBackgroundColor="transparent"
                    />
                  </View>
                </LinearGradient>
                
                {userName && (
                  <View style={styles.userInfo}>
                    <Ionicons name="person-circle" size={20} color="#8B5CF6" />
                    <Text style={styles.userName}>{userName}</Text>
                  </View>
                )}
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <View style={styles.instructionRow}>
                  <View style={styles.instructionIcon}>
                    <Ionicons name="scan-outline" size={24} color="#8B5CF6" />
                  </View>
                  <View style={styles.instructionContent}>
                    <Text style={styles.instructionTitle}>Muestra este código</Text>
                    <Text style={styles.instructionText}>
                      Al anfitrión del evento para registrar tu asistencia
                    </Text>
                  </View>
                </View>

                <View style={styles.instructionRow}>
                  <View style={styles.instructionIcon}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
                  </View>
                  <View style={styles.instructionContent}>
                    <Text style={styles.instructionTitle}>Código único</Text>
                    <Text style={styles.instructionText}>
                      Este es tu código personal de identificación
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={20} color="#8B5CF6" />
                  <Text style={styles.shareButtonText}>Compartir</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#1F1F1F',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrGradient: {
    padding: 16,
    borderRadius: 20,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    gap: 8,
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A2A2A',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  shareButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
});
