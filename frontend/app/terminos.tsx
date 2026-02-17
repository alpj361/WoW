import React from 'react';
import { StyleSheet, ScrollView, Text, View, Platform, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const isWeb = Platform.OS === 'web';

    const lastUpdateDate = new Date().toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <View style={[styles.container, { paddingTop: isWeb ? 0 : insets.top }]}>
            {/* Stack.Screen removed as it is inside a Tab layout */}

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Términos y Condiciones</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingBottom: insets.bottom + 40 }
                ]}
                showsVerticalScrollIndicator={true}
            >
                <Text style={styles.lastUpdate}>Última actualización: {lastUpdateDate}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Qué es Wow</Text>
                    <Text style={styles.paragraph}>
                        Wow es una aplicación para:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Crear y gestionar eventos.</Text>
                        <Text style={styles.bulletItem}>• Descubrir eventos públicos.</Text>
                        <Text style={styles.bulletItem}>• Llevar registro de asistencia.</Text>
                        <Text style={styles.bulletItem}>• Reaccionar a eventos después de asistir.</Text>
                        <Text style={styles.bulletItem}>• Extraer información de eventos desde imágenes o enlaces públicos de Instagram mediante una función opcional.</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        Wow no organiza eventos ni vende entradas.
                        Los eventos públicos mostrados en la plataforma son externos y no están afiliados a Wow.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Acceso a la App</Text>
                    <Text style={styles.paragraph}>
                        El acceso se realiza únicamente mediante inicio de sesión con Google.
                    </Text>
                    <Text style={styles.paragraph}>
                        Al iniciar sesión, aceptas que recibamos:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Nombre</Text>
                        <Text style={styles.bulletItem}>• Correo electrónico</Text>
                        <Text style={styles.bulletItem}>• Foto de perfil</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        Eres responsable del uso de tu cuenta.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Tipos de Eventos</Text>

                    <Text style={styles.subTitle}>Eventos gestionados por usuarios</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Son creados dentro de la app.</Text>
                        <Text style={styles.bulletItem}>• El creador es responsable de la información publicada.</Text>
                    </View>

                    <Text style={styles.subTitle}>Eventos públicos</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Son eventos externos que cualquier persona puede asistir.</Text>
                        <Text style={styles.bulletItem}>• Wow solo los muestra para consulta y organización personal.</Text>
                        <Text style={styles.bulletItem}>• Wow no es organizador ni representante de dichos eventos.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Función de Extracción</Text>
                    <Text style={styles.paragraph}>
                        Wow ofrece una función para ayudarte a completar información de eventos a partir de:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Imágenes cargadas por el usuario.</Text>
                        <Text style={styles.bulletItem}>• Enlaces públicos de Instagram.</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        La extracción no es automática. Se ejecuta únicamente cuando el usuario la activa.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Uso de Inteligencia Artificial</Text>
                    <Text style={styles.paragraph}>
                        La IA se utiliza exclusivamente para analizar imágenes y detectar información como fechas o lugares.
                    </Text>
                    <Text style={styles.paragraph}>
                        La información generada puede contener errores.
                        El usuario debe revisar y confirmar los datos antes de publicarlos.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Responsabilidad del Usuario</Text>
                    <Text style={styles.paragraph}>
                        El usuario se compromete a:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Publicar información veraz.</Text>
                        <Text style={styles.bulletItem}>• No subir contenido sin autorización.</Text>
                        <Text style={styles.bulletItem}>• No usar la app para fines ilegales.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Reacciones y Asistencia</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Solo se puede reaccionar a un evento después de haber marcado asistencia.</Text>
                        <Text style={styles.bulletItem}>• Las reacciones deben ser respetuosas.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Contenido</Text>
                    <Text style={styles.paragraph}>
                        El usuario conserva la propiedad de su contenido. Al publicarlo en Wow, autoriza su visualización dentro de la plataforma.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>9. Limitación de Responsabilidad</Text>
                    <Text style={styles.paragraph}>
                        Wow es una herramienta digital de organización. No garantiza:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Que un evento ocurra.</Text>
                        <Text style={styles.bulletItem}>• Que la información sea exacta.</Text>
                        <Text style={styles.bulletItem}>• Disponibilidad continua del servicio.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>10. Ley Aplicable</Text>
                    <Text style={styles.paragraph}>
                        Estos términos se rigen por la legislación de la República de Guatemala.
                    </Text>
                </View>

                <View style={[styles.section, { alignItems: 'center', marginTop: 20 }]}>
                    <Text style={[styles.paragraph, { fontSize: 13, color: '#6B7280' }]}>
                        Aplicación creada por el grupo StandAtPd (Stand At Platform Development)
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
        backgroundColor: '#0F0F0F',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    headerRight: {
        width: 40, // To balance the header
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
    },
    lastUpdate: {
        color: '#6B7280',
        fontSize: 14,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    subTitle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    paragraph: {
        color: '#D1D5DB',
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 12,
    },
    bulletList: {
        paddingLeft: 8,
        marginBottom: 12,
    },
    bulletItem: {
        color: '#D1D5DB',
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 4,
    },
});
