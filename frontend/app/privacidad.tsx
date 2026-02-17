import React from 'react';
import { StyleSheet, ScrollView, Text, View, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
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
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Política de Privacidad</Text>
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
                    <Text style={styles.sectionTitle}>1. Datos que recopilamos</Text>

                    <Text style={styles.subTitle}>Datos de Google</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Nombre</Text>
                        <Text style={styles.bulletItem}>• Correo electrónico</Text>
                        <Text style={styles.bulletItem}>• Foto de perfil</Text>
                        <Text style={styles.bulletItem}>• Identificador único</Text>
                    </View>

                    <Text style={styles.subTitle}>Datos dentro de la app</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Eventos creados</Text>
                        <Text style={styles.bulletItem}>• Asistencia registrada</Text>
                        <Text style={styles.bulletItem}>• Reacciones</Text>
                        <Text style={styles.bulletItem}>• Imágenes cargadas para análisis</Text>
                    </View>

                    <Text style={styles.subTitle}>Datos técnicos</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Dirección IP</Text>
                        <Text style={styles.bulletItem}>• Información básica del dispositivo</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Para qué usamos los datos</Text>
                    <Text style={styles.paragraph}>
                        Usamos la información para:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Permitir el acceso a la app.</Text>
                        <Text style={styles.bulletItem}>• Guardar tus eventos.</Text>
                        <Text style={styles.bulletItem}>• Analizar imágenes cuando tú lo solicitas.</Text>
                        <Text style={styles.bulletItem}>• Mejorar el funcionamiento del servicio.</Text>
                        <Text style={styles.bulletItem}>• Mantener la seguridad.</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        No vendemos datos personales.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Uso de IA</Text>
                    <Text style={styles.paragraph}>
                        Cuando cargas una imagen y activas la función de análisis, la imagen puede ser procesada para identificar información relevante del evento.
                    </Text>
                    <Text style={styles.paragraph}>
                        La IA solo se utiliza para análisis de imágenes.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Proveedores externos</Text>
                    <Text style={styles.paragraph}>
                        Podemos usar servicios de terceros para:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Autenticación (Google).</Text>
                        <Text style={styles.bulletItem}>• Hosting.</Text>
                        <Text style={styles.bulletItem}>• Procesamiento técnico de imágenes.</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        Estos proveedores solo procesan datos para que la app funcione.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Conservación</Text>
                    <Text style={styles.paragraph}>
                        Los datos se conservan mientras tu cuenta esté activa.
                        Puedes solicitar eliminación de tu cuenta en cualquier momento.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Seguridad</Text>
                    <Text style={styles.paragraph}>
                        Aplicamos medidas razonables para proteger la información, pero ningún sistema es completamente seguro.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Contacto</Text>
                    <Text style={styles.paragraph}>
                        Para consultas sobre privacidad puedes escribir a: contacto@standatpd.com.
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
        width: 40,
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
