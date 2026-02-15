
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Linking, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { useEventStore } from '../../src/store/eventStore';
import { parseISO, isPast, isFuture, isToday, parse, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    end_time?: string | null;
    location: string;
    description: string;
    image: string;
    category: string;
    organizer?: string | null;
    price?: number | null;
    registration_form_url?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    user_id?: string | null;
    requires_attendance_check?: boolean | null;
    is_recurring?: boolean | null;
    recurring_dates?: string[] | null;
    target_audience?: string[] | null;
}

/** Parse a date string (YYYY-MM-DD or ISO) as local noon to avoid UTC day-shift */
const toLocalDate = (dateStr: string): Date => new Date(dateStr.substring(0, 10) + 'T12:00:00');

/** Returns the end datetime of an event (uses end_time if available, else 23:59 of event date) */
const getEventEndDateTime = (evt: Event): Date => {
    if (evt.end_time && evt.end_time !== 'No especificado') {
        const d = new Date(`${evt.date}T${evt.end_time}`);
        if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(`${evt.date}T23:59:59`);
    return isNaN(d.getTime()) ? new Date(evt.date) : d;
};

/** True when the event has fully ended. For recurring: at least one date has fully passed. */
const isEventFullyPast = (evt: Event): boolean => {
    if (evt.is_recurring && evt.recurring_dates && evt.recurring_dates.length > 0) {
        const allDates = [evt.date, ...evt.recurring_dates];
        return allDates.some(d => new Date(`${d}T23:59:59`) < new Date());
    }
    return getEventEndDateTime(evt) < new Date();
};

/** True when the event is currently happening (started but not yet ended). Not applied to recurring. */
const isEventLive = (evt: Event): boolean => {
    if (evt.is_recurring) return false;
    const start = new Date(`${evt.date}T${evt.time || '00:00'}`);
    const end = getEventEndDateTime(evt);
    const now = new Date();
    return !isNaN(start.getTime()) && start <= now && end >= now;
};

export default function EventDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { registerForEvent, markAttended } = useEventStore();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Attendance modal
    const [showDateSelectionModal, setShowDateSelectionModal] = useState(false);
    const [pastDates, setPastDates] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

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
        if (!user) {
            Alert.alert('Inicia sesión', 'Debes iniciar sesión para interactuar');
            return;
        }

        if (event && isEventFullyPast(event)) {
            handleMarkAttendance();
        } else {
            startRegistrationFlow();
        }
    };

    const startRegistrationFlow = () => {
        console.log('✅ Starting Registration Flow');

        const eventPrice = event?.price ? parseFloat(String(event.price)) : 0;
        const hasPrice = eventPrice > 0;
        const hasForm = !!event?.registration_form_url;
        const isHostEvent = !!event?.user_id;

        if (hasForm) {
            setShowRegistrationModal(true);
        } else if (hasPrice && isHostEvent) {
            setShowPaymentModal(true);
        } else if (hasPrice && !isHostEvent) {
            Alert.alert(
                'Evento con Costo',
                `Este evento tiene un costo de Q${eventPrice.toFixed(2)}. Contacta al organizador o revisa la descripción para pagar.`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Entendido, Registrarme', onPress: () => handleDirectRegistration() }
                ]
            );
        } else {
            handleDirectRegistration();
        }
    };

    const handleMarkAttendance = () => {
        if (event?.is_recurring && event.recurring_dates) {
            const allDates = [event.date, ...event.recurring_dates];
            // Use local-time end-of-day to avoid UTC offset shifting dates
            const validDates = allDates.filter(d => new Date(`${d}T23:59:59`) < new Date());

            if (validDates.length > 0) {
                setPastDates(validDates);
                setSelectedDates([]);
                setShowDateSelectionModal(true);
                return;
            }
            confirmAttendance([event.date]);
        } else {
            confirmAttendance([event?.date || '']);
        }
    };

    const toggleDateSelection = (dateStr: string) => {
        if (selectedDates.includes(dateStr)) {
            setSelectedDates(selectedDates.filter(d => d !== dateStr));
        } else {
            setSelectedDates([...selectedDates, dateStr]);
        }
    };

    const confirmAttendance = async (dates: string[]) => {
        if (!event || dates.length === 0) return;
        setIsSubmitting(true);
        try {
            // Mark for each selected date
            // We use Promise.all to do it in parallel
            await Promise.all(dates.map(dateStr => markAttended(event.id, undefined, dateStr)));

            Alert.alert(
                '¡Asistencia registrada!',
                dates.length > 1
                    ? `Has marcado asistencia en ${dates.length} fechas.`
                    : `Has marcado tu asistencia para el ${dates[0]}`
            );
            router.back();
        } catch (error) {
            Alert.alert('Error', 'No se pudo registrar la asistencia');
        } finally {
            setIsSubmitting(false);
            setShowDateSelectionModal(false);
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

    const getActionButtonLabel = (): string | null => {
        if (!event) return null;

        // "Asistir" only when the event has fully ended
        if (isEventFullyPast(event)) {
            return 'Asistir';
        }

        // Future / ongoing: only show button if there's a registration flow
        const hasForm = !!event.registration_form_url;
        const hasPrice = !!(event.price && event.price > 0);
        const isHostEvent = !!event.user_id;

        if (hasForm || (hasPrice && isHostEvent)) {
            return 'Registrarse';
        }

        // Free public future event → no action needed
        return null;
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
                        <View style={styles.badgeRow}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{event.category}</Text>
                            </View>
                            {isEventLive(event) && (
                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveBadgeText}>EN VIVO</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.title}>{event.title}</Text>
                    </View>

                    <View style={styles.metaContainer}>
                        {/* Fecha - Si es recurrente, mostrar todas las fechas como chips */}
                        {event.is_recurring && event.recurring_dates && event.recurring_dates.length > 0 ? (
                            <View style={styles.allDatesContainer}>
                                <View style={styles.metaRow}>
                                    <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                                    <Text style={[styles.metaText, { color: '#8B5CF6', fontWeight: '600' }]}>
                                        Evento recurrente ({1 + event.recurring_dates.length} fechas)
                                    </Text>
                                </View>
                                <View style={styles.recurringContainer}>
                                    {/* Fecha principal */}
                                    <View style={[styles.recurringChip, styles.mainDateChip]}>
                                        <Ionicons name="calendar" size={14} color="#8B5CF6" />
                                        <Text style={styles.recurringChipText}>{format(toLocalDate(event.date), 'd MMM yyyy', { locale: es })}</Text>
                                    </View>
                                    {/* Fechas adicionales */}
                                    {event.recurring_dates.map((dateStr, index) => (
                                        <View key={index} style={styles.recurringChip}>
                                            <Ionicons name="calendar" size={14} color="#8B5CF6" />
                                            <Text style={styles.recurringChipText}>{format(toLocalDate(dateStr), 'd MMM yyyy', { locale: es })}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                                <Text style={styles.metaText}>{format(toLocalDate(event.date), "EEEE d 'de' MMMM yyyy", { locale: es })}</Text>
                            </View>
                        )}

                        {/* Hora inicio - fin */}
                        {!!event.time && event.time !== 'No especificado' && (
                            <View style={styles.metaRow}>
                                <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                                <Text style={styles.metaText}>
                                    {event.time}{event.end_time && event.end_time !== 'No especificado' ? ` - ${event.end_time}` : ''}
                                </Text>
                            </View>
                        )}

                        {/* Ubicación */}
                        {!!event.location && (
                            <View style={styles.metaRow}>
                                <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                                <Text style={styles.metaText}>{event.location}</Text>
                            </View>
                        )}

                        {/* Organizador — Instagram */}
                        {!!event.organizer && (
                            <TouchableOpacity
                                style={styles.instagramRow}
                                onPress={() => {
                                    const handle = event.organizer!.replace(/^@/, '');
                                    Linking.openURL(`https://instagram.com/${handle}`);
                                }}
                                activeOpacity={0.75}
                            >
                                <View style={styles.instagramIconWrap}>
                                    <Ionicons name="logo-instagram" size={18} color="#fff" />
                                </View>
                                <Text style={styles.instagramHandle}>
                                    {event.organizer.startsWith('@') ? event.organizer : `@${event.organizer}`}
                                </Text>
                                <Ionicons name="open-outline" size={14} color="#E1306C" style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        )}

                        {/* Precio */}
                        {event.price && event.price > 0 && (
                            <View style={styles.metaRow}>
                                <Ionicons name="pricetag-outline" size={20} color="#10B981" />
                                <Text style={[styles.metaText, styles.priceText]}>
                                    Q{event.price.toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Control de asistencia */}
                        {event.requires_attendance_check && (
                            <View style={styles.metaRow}>
                                <Ionicons name="qr-code-outline" size={20} color="#F59E0B" />
                                <Text style={[styles.metaText, { color: '#F59E0B' }]}>
                                    Requiere check-in con QR
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Target Audience */}
                    {event.target_audience && event.target_audience.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>Organizado para</Text>
                            <View style={styles.audienceContainer}>
                                {event.target_audience.map((audience, index) => {
                                    const [type, value, extra] = audience.split(':');
                                    let displayText = '';
                                    let icon: keyof typeof Ionicons.glyphMap = 'people-outline';

                                    if (type === 'audiencia') {
                                        displayText = value;
                                        icon = 'people-outline';
                                    } else if (type === 'universidad') {
                                        displayText = extra ? `${value} - ${extra}` : value;
                                        icon = 'school-outline';
                                    } else if (type === 'miembros') {
                                        displayText = `Miembros: ${value}`;
                                        icon = 'person-circle-outline';
                                    }

                                    return (
                                        <View key={index} style={styles.audienceChip}>
                                            <Ionicons name={icon} size={14} color="#D946EF" />
                                            <Text style={styles.audienceChipText}>{displayText}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {!!event.description && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>Acerca del evento</Text>
                            <Text style={styles.description}>{event.description}</Text>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Action Bar — only shown when there's an action to take */}
            {getActionButtonLabel() !== null && (
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleAttendClick}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                {getActionButtonLabel()}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Date Selection Modal */}
            <Modal
                visible={showDateSelectionModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDateSelectionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalDismiss} onPress={() => setShowDateSelectionModal(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>¿A cuáles fechas asististe?</Text>
                            <TouchableOpacity onPress={() => setShowDateSelectionModal(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.modalText, { marginBottom: 16, textAlign: 'left' }]}>
                                Selecciona todas las fechas a las que asististe:
                            </Text>
                            {pastDates.map((dateStr, idx) => {
                                const isSelected = selectedDates.includes(dateStr);
                                let displayDate = dateStr;
                                try {
                                    displayDate = format(new Date(`${dateStr}T12:00:00`), "EEEE d 'de' MMMM yyyy", { locale: es });
                                } catch {}
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.modalButton, isSelected && styles.modalButtonSelected]}
                                        onPress={() => toggleDateSelection(dateStr)}
                                    >
                                        <Ionicons
                                            name={isSelected ? "checkbox" : "square-outline"}
                                            size={24}
                                            color={isSelected ? '#8B5CF6' : '#9CA3AF'}
                                        />
                                        <Text style={[styles.modalButtonText, isSelected && { color: '#C4B5FD' }]}>
                                            {displayDate}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: '#8B5CF6', marginTop: 16, justifyContent: 'center' },
                                selectedDates.length === 0 && { opacity: 0.5 }
                            ]}
                            onPress={() => confirmAttendance(selectedDates)}
                            disabled={selectedDates.length === 0}
                        >
                            <Text style={[styles.modalButtonText, { fontWeight: 'bold' }]}>Confirmar Asistencia</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    liveBadgeText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
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
    priceText: {
        color: '#10B981',
        fontWeight: '600',
    },
    allDatesContainer: {
        gap: 12,
    },
    mainDateChip: {
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1.5,
    },
    recurringContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    recurringChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    recurringChipText: {
        color: '#C4B5FD',
        fontSize: 13,
        fontWeight: '500',
    },
    audienceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    audienceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(217, 70, 239, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(217, 70, 239, 0.3)',
    },
    audienceChipText: {
        color: '#F0ABFC',
        fontSize: 13,
        fontWeight: '500',
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
        backgroundColor: '#1E1E1E', // Dark background for unselected
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'flex-start', // Align left for list items
        gap: 12,
        marginBottom: 8, // Space between items
        borderWidth: 1,
        borderColor: '#333',
    },
    modalButtonSelected: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)', // Light purple bg
        borderColor: '#8B5CF6',
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
    instagramRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(225, 48, 108, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(225, 48, 108, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignSelf: 'flex-start',
        minWidth: 180,
    },
    instagramIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#E1306C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instagramHandle: {
        color: '#F9A8D4',
        fontSize: 15,
        fontWeight: '600',
    },
});
