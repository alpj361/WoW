# Plan Completo: Sistema de Eventos con Precio, Formulario de Registro y Pagos

He analizado el código actual y documentación. Aquí está el plan detallado para implementar las nuevas características:

---

## 📋 Resumen de Funcionalidades

### 1. **Campos Nuevos en Eventos**
- **Precio**: Campo opcional para eventos de pago
- **Formulario de Registro**: URL del formulario que los asistentes deben llenar
- **Información de Pago**: Número de cuenta bancaria y nombre del banco (solo si hay precio)

### 2. **Flujo para Eventos Públicos (sin anfitrión)**
- Se crean normalmente con los campos nuevos opcionales
- No requieren aprobación

### 3. **Flujo para Eventos de Anfitrión**
Al guardar cupo en un evento de anfitrión:

**A. Si tiene formulario de registro:**
- Mostrar popup con botón "Llenar Formulario"
- Descripción: "El evento pide que llenes este formulario para asistir"
- Al hacer clic, abrir el link del formulario

**B. Si tiene precio:**
- Mostrar popup con información de pago:
  - Precio del evento
  - Número de cuenta bancaria
  - Nombre del banco
  - Opción para subir foto de la boleta de pago

**C. Estado "Pendiente":**
- Las solicitudes quedan en estado `pending` hasta que el anfitrión apruebe
- El anfitrión puede ver, aprobar o rechazar solicitudes

---

## 🗄️ Cambios en Base de Datos

### Modificar tabla `events`
```sql
ALTER TABLE events 
ADD COLUMN price DECIMAL(10,2),
ADD COLUMN registration_form_url TEXT,
ADD COLUMN bank_account_number VARCHAR(50),
ADD COLUMN bank_name VARCHAR(100);
```

### Nueva tabla `event_registrations`
```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  payment_receipt_url TEXT, -- URL de la foto de la boleta
  registration_form_completed BOOLEAN DEFAULT false,
  rejection_reason TEXT, -- Razón por la cual fue rechazado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
```

---

## 🔧 Modificaciones por Archivo

### 1. **Backend API** (`event-analyzer/server/routes/events.js`)

#### Modificar POST `/api/events`
- Agregar campos: `price`, `registration_form_url`, `bank_account_number`, `bank_name`

#### Nuevo: POST `/api/events/:eventId/register`
- Crear registro de solicitud con estado `pending`
- Aceptar `payment_receipt_url` si aplica

#### Nuevo: GET `/api/events/:eventId/registrations`
- Listar todas las solicitudes para un evento (solo para el anfitrión)
- Incluir información del usuario y estado

#### Nuevo: PATCH `/api/events/registrations/:registrationId/approve`
- Cambiar status a `approved`
- Mover a `saved_events` si es aprobado

#### Nuevo: PATCH `/api/events/registrations/:registrationId/reject`
- Cambiar status a `rejected`
- Aceptar campo opcional `rejection_reason` para especificar por qué se rechazó

---

### 2. **Frontend - Tipos e Interfaces** (`frontend/src/services/api.ts`)

```typescript
export interface Event {
  // ... campos existentes ...
  price?: number | null;
  registration_form_url?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
}

export interface CreateEventData {
  // ... campos existentes ...
  price?: number | null;
  registration_form_url?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  payment_receipt_url?: string | null;
  registration_form_completed: boolean;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

// Nuevas funciones API
export async function registerForEvent(
  eventId: string, 
  paymentReceiptUrl?: string
): Promise<EventRegistration>;

export async function fetchEventRegistrations(eventId: string): Promise<EventRegistration[]>;

export async function approveRegistration(registrationId: string): Promise<void>;

export async function rejectRegistration(
  registrationId: string, 
  rejectionReason?: string
): Promise<void>;

export async function uploadPaymentReceipt(file: File): Promise<string>;
```

---

### 3. **Frontend - Store** (`frontend/src/store/eventStore.ts`)

```typescript
interface EventStore {
  // ... estado existente ...
  pendingRegistrations: EventRegistration[];
  
  // Nuevas acciones
  registerForEvent: (eventId: string, paymentReceiptUrl?: string) => Promise<void>;
  fetchPendingRegistrations: (eventId: string) => Promise<void>;
  approveRegistration: (registrationId: string) => Promise<void>;
  rejectRegistration: (registrationId: string, rejectionReason?: string) => Promise<void>;
  resubmitRegistration: (eventId: string, paymentReceiptUrl?: string) => Promise<void>;
}
```

---

### 4. **Pantalla Crear Evento** (`frontend/app/create.tsx`)

#### Nuevos campos en el formulario:

```tsx
// Estado
const [price, setPrice] = useState<string>('');
const [registrationFormUrl, setRegistrationFormUrl] = useState('');
const [bankAccountNumber, setBankAccountNumber] = useState('');
const [bankName, setBankName] = useState('');

// UI - Sección de Precio (solo si es anfitrión)
{isHost && (
  <>
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Precio (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Q 0.00"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
      />
    </View>
    
    {price && parseFloat(price) > 0 && (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Banco</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del banco"
            value={bankName}
            onChangeText={setBankName}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Número de Cuenta</Text>
          <TextInput
            style={styles.input}
            placeholder="1234567890"
            keyboardType="number-pad"
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
          />
        </View>
      </>
    )}
    
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Formulario de Registro (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://forms.google.com/..."
        keyboardType="url"
        value={registrationFormUrl}
        onChangeText={setRegistrationFormUrl}
      />
    </View>
  </>
)}
```

---

### 5. **Detalle de Evento** (`frontend/app/event/[id].tsx`)

#### Modificar botón "Asistir" para manejar los casos:

```tsx
const handleAttend = async () => {
  // Si es evento de anfitrión
  if (event.user_id) {
    // Caso 1: Tiene formulario de registro
    if (event.registration_form_url) {
      showRegistrationFormModal();
    }
    
    // Caso 2: Tiene precio
    else if (event.price && event.price > 0) {
      showPaymentModal();
    }
    
    // Caso 3: Normal, crear solicitud pending
    else {
      await registerForEvent(event.id);
    }
  } 
  // Evento público normal
  else {
    await saveEvent(event.id);
  }
};
```

#### Modal de Formulario de Registro:
```tsx
<Modal visible={showFormModal}>
  <View style={styles.modalContent}>
    <Ionicons name="document-text" size={48} color="#8B5CF6" />
    <Text style={styles.modalTitle}>Formulario Requerido</Text>
    <Text style={styles.modalDescription}>
      El evento pide que llenes este formulario para asistir
    </Text>
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={() => Linking.openURL(event.registration_form_url)}
    >
      <Text>Llenar Formulario</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={markFormCompleted}>
      <Text>Ya llené el formulario</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

#### Modal de Pago:
```tsx
<Modal visible={showPaymentModal}>
  <View style={styles.modalContent}>
    <Ionicons name="card" size={48} color="#8B5CF6" />
    <Text style={styles.modalTitle}>Información de Pago</Text>
    
    <View style={styles.paymentInfo}>
      <Text style={styles.priceText}>Q {event.price}</Text>
      <Text style={styles.bankInfo}>Banco: {event.bank_name}</Text>
      <Text style={styles.accountInfo}>Cuenta: {event.bank_account_number}</Text>
    </View>
    
    <TouchableOpacity 
      style={styles.uploadButton}
      onPress={pickPaymentReceipt}
    >
      <Ionicons name="cloud-upload" size={24} />
      <Text>Subir Boleta de Pago</Text>
    </TouchableOpacity>
    
    {paymentReceipt && (
      <Image source={{ uri: paymentReceipt }} style={styles.receiptPreview} />
    )}
    
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={submitPaymentReceipt}
      disabled={!paymentReceipt}
    >
      <Text>Enviar Solicitud</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

---

### 6. **Pantalla Mis Eventos** (`frontend/app/myevents.tsx`)

#### Tab "Anfitrión" - Mostrar solicitudes pendientes:

```tsx
// Badge en el card del evento
<View style={styles.pendingBadge}>
  <Ionicons name="time" size={16} color="#F59E0B" />
  <Text>{pendingCount} pendientes</Text>
</View>

// Botón para ver solicitudes
<TouchableOpacity onPress={() => showRegistrationsModal(event.id)}>
  <Text>Ver Solicitudes</Text>
</TouchableOpacity>
```

#### Modal de Solicitudes:
```tsx
<Modal visible={showRegistrations}>
  <FlatList
    data={registrations}
    renderItem={({ item }) => (
      <View style={styles.registrationCard}>
        <Image source={{ uri: item.user.avatar_url }} />
        <Text>{item.user.full_name}</Text>
        
        {item.payment_receipt_url && (
          <TouchableOpacity onPress={() => viewReceipt(item)}>
            <Text>Ver Boleta</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => approve(item.id)}>
            <Ionicons name="checkmark-circle" color="green" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showRejectModal(item.id)}>
            <Ionicons name="close-circle" color="red" />
          </TouchableOpacity>
        </View>
      </View>
    )}
  />
</Modal>

{/* Modal para Rechazar con Razón */}
<Modal visible={showRejectReasonModal}>
  <View style={styles.modalContent}>
    <Ionicons name="close-circle" size={48} color="#EF4444" />
    <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
    <Text style={styles.modalDescription}>
      Puedes agregar una razón opcional para el rechazo
    </Text>
    
    <TextInput
      style={styles.textArea}
      placeholder="Razón del rechazo (opcional)"
      multiline
      numberOfLines={4}
      value={rejectionReason}
      onChangeText={setRejectionReason}
    />
    
    <View style={styles.buttonRow}>
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={closeRejectModal}
      >
        <Text>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.rejectButton}
        onPress={() => confirmReject(selectedRegistrationId, rejectionReason)}
      >
        <Text>Rechazar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```


---

### 7. **Vista del Usuario - Estado de Solicitudes**

#### En "Mis Eventos" - Tab de eventos guardados/solicitados:

```tsx
// Badge de estado según el status
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'pending':
      return (
        <View style={[styles.statusBadge, styles.pendingBadge]}>
          <Ionicons name="time" size={14} color="#F59E0B" />
          <Text style={styles.badgeText}>Pendiente</Text>
        </View>
      );
    case 'approved':
      return (
        <View style={[styles.statusBadge, styles.approvedBadge]}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={styles.badgeText}>Aprobado</Text>
        </View>
      );
    case 'rejected':
      return (
        <View style={[styles.statusBadge, styles.rejectedBadge]}>
          <Ionicons name="close-circle" size={14} color="#EF4444" />
          <Text style={styles.badgeText}>Rechazado</Text>
        </View>
      );
  }
};

// Card del evento con estado
<View style={styles.eventCard}>
  {getStatusBadge(registration.status)}
  
  {/* Información del evento */}
  
  {/* Si está rechazado, mostrar razón y botón de reenviar */}
  {registration.status === 'rejected' && (
    <View style={styles.rejectionSection}>
      {registration.rejection_reason && (
        <View style={styles.rejectionReasonBox}>
          <Text style={styles.rejectionReasonLabel}>Razón del rechazo:</Text>
          <Text style={styles.rejectionReasonText}>
            {registration.rejection_reason}
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.resubmitButton}
        onPress={() => handleResubmit(registration.event_id)}
      >
        <Ionicons name="refresh" size={20} color="#8B5CF6" />
        <Text style={styles.resubmitText}>Reenviar Solicitud</Text>
      </TouchableOpacity>
    </View>
  )}
</View>
```

#### Lógica de Reenvío:
```tsx
const handleResubmit = async (eventId: string) => {
  // Obtener el evento para ver si requiere pago
  const event = await fetchEvent(eventId);
  
  // Si requiere pago, mostrar modal de pago nuevamente
  if (event.price && event.price > 0) {
    showPaymentModal();
  } else {
    // Si no requiere pago, reenviar directamente
    await resubmitRegistration(eventId);
  }
};
```

---

## 📝 Orden de Implementación

1. ✅ **Análisis completado** - Base de código revisado
2. **Base de Datos** - Migrations SQL en Supabase
3. **Backend API** - Nuevos endpoints y modificaciones
4. **Frontend Types** - Interfaces y tipos
5. **Frontend Store** - Estado y acciones
6. **Pantalla Crear Evento** - Campos nuevos
7. **Pantalla Detalle** - Modals de registro/pago
8. **Pantalla Mis Eventos** - Gestión de solicitudes
9. **Vista Usuario - Estados** - Badges y reenvío
10. **Testing** - Flujo completo incluyendo rechazos
11. **Documentación** - Actualizar README

---

## ✅ Validaciones Importantes

- Si el evento tiene precio, **debe tener** banco y número de cuenta
- Solo eventos de anfitrión pueden tener precio/formulario
- Las boletas de pago se almacenan en Supabase Storage
- Estado `pending` se crea automáticamente al registrarse
- Solo el anfitrión puede aprobar/rechazar solicitudes
- **Razón de rechazo** es opcional pero recomendada para mejor comunicación
- Usuario puede **reenviar solicitud** después de ser rechazado
- Al reenviar, se crea una nueva solicitud (la anterior queda como histórico)
- **Estado "Rechazado"** se muestra con label rojo distintivo
