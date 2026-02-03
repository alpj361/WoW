
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Linking, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { useEventStore } from '../../src/store/eventStore';

interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    image: string;
    category: string;
    price?: number | null;
    registration_form_url?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    user_id?: string | null;
}

export default function EventDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { registerForEvent } = useEventStore();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id && id !== 'undefined') {
            fetchEventDetails();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setEvent(data);
        } catch (error) {
            console.error('Error fetching event details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendClick = () => {
        console.log('🎯 BUTTON CLICKED - handleAttendClick called');
        console.log('🔍 User exists:', !!user);

        if (!user) {
            Alert.alert('Inicia sesión', 'Debes iniciar sesión para registrarte a este evento');
            return;
        }

        console.log('📊 RAW Event data:', JSON.stringify({
            price: event?.price,
            priceType: typeof event?.price,
            registration_form_url: event?.registration_form_url,
            bank_name: event?.bank_name,
            bank_account_number: event?.bank_account_number,
            user_id: event?.user_id
        }, null, 2));

        const eventPrice = event?.price ? parseFloat(String(event.price)) : 0;
        const hasPrice = eventPrice > 0;
        const hasForm = !!event?.registration_form_url;
        const isHostEvent = !!event?.user_id;

        console.log('💰 Parsed values:', {
            originalPrice: event?.price,
            parsedPrice: eventPrice,
            hasPrice,
            hasForm,
            bankName: event?.bank_name,
            isHostEvent
        });

        console.log('🚪 Decision: hasForm=', hasForm, ', hasPrice=', hasPrice, ', isHostEvent=', isHostEvent);

        // If event has registration form, open it first
        if (hasForm) {
            console.log('✅ Opening registration modal');
            setShowRegistrationModal(true);
        }
        // If event has price AND is a host event, show payment modal
        else if (hasPrice && isHostEvent) {
            console.log('✅ Opening payment modal');
            setShowPaymentModal(true);
        }
        // Public event with price (informational only)
        else if (hasPrice && !isHostEvent) {
            console.log('✅ Public event with price -> Informational alert then Direct registration');
            Alert.alert(
                'Evento con Costo',
                `Este evento tiene un costo de Q${eventPrice.toFixed(2)}. Contacta al organizador o revisa la descripción para pagar.`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel'
                    },
                    {
                        text: 'Entendido, Asistir',
                        onPress: () => handleDirectRegistration()
                    }
                ]
            );
        }
        // Free event with no form, register directly
        else {
            console.log('✅ Direct registration (free event)');
            handleDirectRegistration();
        }
    };

    const handleDirectRegistration = async () => {
        if (!user || !event) return;

        setIsSubmitting(true);
        try {
            await registerForEvent(event.id);
            Alert.alert('¡Registrado!', 'Te has registrado exitosamente al evento');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'No se pudo completar el registro. Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenForm = async () => {
        if (event?.registration_form_url) {
            await Linking.openURL(event.registration_form_url);
            setShowRegistrationModal(false);

            // After form, check if payment is needed
            // Only show payment modal if it's a HOST event with price
            if (event.price && event.price > 0 && event.user_id) {
                setTimeout(() => setShowPaymentModal(true), 500);
            } else {
                // No payment needed (or public event), register directly
                handleDirectRegistration();
            }
        }
    };

    const pickReceipt = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir el comprobante.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setPaymentReceiptUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSubmitPayment = async () => {
        if (!user || !event) return;

        if (!paymentReceiptUrl) {
            Alert.alert('Error', 'Por favor sube el comprobante de pago');
            return;
        }

        setIsSubmitting(true);
        try {
            await registerForEvent(
                event.id,
                paymentReceiptUrl,
                event.registration_form_url ? true : false
            );
            setShowPaymentModal(false);
            setPaymentReceiptUrl('');
            Alert.alert(
                '¡Solicitud enviada!',
                'Tu solicitud de registro ha sido enviada. El organizador la revisará pronto.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Evento no encontrado</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Regresar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView bounces={false}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: event.image }} style={styles.image} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />
                    <TouchableOpacity
                        style={styles.floatingBackButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{event.category}</Text>
                        </View>
                        <Text style={styles.title}>{event.title}</Text>
                    </View>

                    <View style={styles.metaContainer}>
                        <View style={styles.metaRow}>
                            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.metaText}>{event.date}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.metaText}>{event.time}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.metaText}>{event.location}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Acerca del evento</Text>
                    <Text style={styles.description}>{event.description}</Text>
                </View>
            </ScrollView>

            {/* Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAttendClick}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Asistir</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Registration Form Modal */}
            <Modal
                visible={showRegistrationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRegistrationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={styles.modalDismiss}
                        onPress={() => setShowRegistrationModal(false)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Formulario de Registro</Text>
                            <TouchableOpacity onPress={() => setShowRegistrationModal(false)}>
                                <Ionicons name="close" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Ionicons name="document-text" size={64} color="#8B5CF6" style={{ alignSelf: 'center', marginBottom: 16 }} />
                            <Text style={styles.modalText}>
                                Este evento requiere que completes un formulario de registro.
                            </Text>
                            <Text style={[styles.modalText, { marginTop: 8, fontSize: 14, color: '#6B7280' }]}>
                                Se abrirá en tu navegador. Después continúa con el proceso de registro.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleOpenForm}
                        >
                            <Ionicons name="open-outline" size={20} color="#FFF" />
                            <Text style={styles.modalButtonText}>Abrir Formulario</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Payment Modal */}
            <Modal
                visible={showPaymentModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={styles.modalDismiss}
                        onPress={() => setShowPaymentModal(false)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Comprobante de Pago</Text>
                            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                                <Ionicons name="close" size={28} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {event?.price && (
                                <View style={styles.priceCard}>
                                    <Text style={styles.priceLabel}>Precio del Evento</Text>
                                    <Text style={styles.priceAmount}>Q{event.price.toFixed(2)}</Text>
                                </View>
                            )}

                            {event?.bank_name && event?.bank_account_number && (
                                <View style={styles.bankInfo}>
                                    <Text style={styles.bankInfoLabel}>Información de Pago</Text>
                                    <View style={styles.bankInfoRow}>
                                        <Ionicons name="business" size={16} color="#9CA3AF" />
                                        <Text style={styles.bankInfoText}>{event.bank_name}</Text>
                                    </View>
                                    <View style={styles.bankInfoRow}>
                                        <Ionicons name="card" size={16} color="#9CA3AF" />
                                        <Text style={styles.bankInfoText}>{event.bank_account_number}</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.uploadLabel}>Sube el comprobante de pago</Text>

                            {paymentReceiptUrl ? (
                                <View style={styles.receiptPreview}>
                                    <Image source={{ uri: paymentReceiptUrl }} style={styles.receiptImage} />
                                    <TouchableOpacity
                                        style={styles.removeReceipt}
                                        onPress={() => setPaymentReceiptUrl('')}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={pickReceipt}
                                >
                                    <Ionicons name="cloud-upload" size={32} color="#8B5CF6" />
                                    <Text style={styles.uploadButtonText}>Seleccionar Imagen</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                (!paymentReceiptUrl || isSubmitting) && styles.modalButtonDisabled
                            ]}
                            onPress={handleSubmitPayment}
                            disabled={!paymentReceiptUrl || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                    <Text style={styles.modalButtonText}>Enviar Solicitud</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: '#FFF',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    imageContainer: {
        height: 350,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    floatingBackButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        marginTop: -40,
    },
    header: {
        marginBottom: 20,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    title: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 34,
    },
    metaContainer: {
        gap: 16,
        marginBottom: 24,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaText: {
        color: '#D1D5DB',
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 24,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    description: {
        color: '#9CA3AF',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 100, // Space for action bar
    },
    backButton: {
        padding: 12,
        backgroundColor: '#333',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFF',
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000',
        padding: 20,
        paddingBottom: 40,
        flexDirection: 'row',
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    primaryButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalDismiss: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#1F1F1F',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    modalBody: {
        padding: 20,
    },
    modalText: {
        fontSize: 16,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 24,
    },
    modalButton: {
        flexDirection: 'row',
        backgroundColor: '#8B5CF6',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginTop: 16,
    },
    modalButtonDisabled: {
        backgroundColor: '#4B5563',
        opacity: 0.6,
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    priceCard: {
        backgroundColor: '#8B5CF6',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    priceLabel: {
        color: '#E9D5FF',
        fontSize: 14,
        marginBottom: 8,
    },
    priceAmount: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    bankInfo: {
        backgroundColor: '#2A2A2A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    bankInfoLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    bankInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    bankInfoText: {
        color: '#FFF',
        fontSize: 14,
    },
    uploadLabel: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 12,
    },
    uploadButton: {
        backgroundColor: '#2A2A2A',
        borderWidth: 2,
        borderColor: '#374151',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        gap: 12,
    },
    uploadButtonText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
    },
    receiptPreview: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    receiptImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    removeReceipt: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
    },
});
