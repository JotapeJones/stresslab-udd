# StressLab UDD — ChatBot de Apoyo al Manejo del Estrés Académico

Aplicación web desarrollada para la tesis de pregrado:

> **"Evaluación de los cambios en los niveles de cortisol salival en estudiantes de Tecnología Médica - UDD antes y después de un certamen académico: efecto de intervenciones no farmacológicas para la reducción del estrés"**
>
> Florencia Arrieta · Javiera Díaz  
> Profesor guía: T.M. Juan Pablo Alcaya  
> Escuela de Tecnología Médica — Universidad del Desarrollo, 2026

---

## Descripción general

El chatbot guía a los participantes (N=6) durante el período intercertámenes en la práctica autónoma de tres técnicas de reducción de estrés con respaldo científico:

- **Respiración lenta diafragmática** — activación vagal y supresión del eje HPA vía NTS → PVN
- **Mindfulness** — regulación descendente CPFDL → amígdala → HPA
- **Actividad física aeróbica moderada** — adaptación cruzada y neuroprotección vía BDNF

Los datos de bienestar subjetivo (check-ins pre/post sesión), adherencia y cuestionario de cierre se almacenan en Firebase Realtime Database y son accesibles al equipo investigador desde el panel de dashboard.

---

## Estructura del proyecto

```
cortisol-chatbot/
├── index.html          ← Página de entrada (acceso participante + investigador)
├── chat.html           ← Interfaz de chat del participante
├── dashboard.html      ← Panel del investigador
├── css/
│   └── style.css       ← Estilos completos
├── js/
│   ├── config.js       ← ⚠️ CONFIGURAR ANTES DE SUBIR
│   ├── db.js           ← Capa Firebase (lectura/escritura)
│   ├── chat.js         ← Motor conversacional (Claude API)
│   ├── breathing.js    ← Animación de respiración
│   ├── email.js        ← Recordatorios EmailJS
│   └── dashboard.js    ← Panel investigador + exportación CSV
└── README.md
```

---

## Configuración paso a paso

### Paso 1 — Firebase Realtime Database

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto (nombre sugerido: `stresslab-udd`)
3. En el panel lateral → **Realtime Database** → Crear base de datos
4. Selecciona la región más cercana (ej: `us-central1`)
5. Inicia en **modo de prueba** (permite lectura/escritura sin autenticación durante 30 días)
6. En **Configuración del proyecto** → **Tus apps** → Agrega una app web
7. Copia el objeto `firebaseConfig` que aparece

Edita `js/config.js` y reemplaza los valores en el bloque `FIREBASE`:

```js
FIREBASE: {
  apiKey:            'AIzaSy...',
  authDomain:        'stresslab-udd.firebaseapp.com',
  databaseURL:       'https://stresslab-udd-default-rtdb.firebaseio.com',
  projectId:         'stresslab-udd',
  storageBucket:     'stresslab-udd.appspot.com',
  messagingSenderId: '123456789',
  appId:             '1:123456789:web:abcdef'
},
```

> **Reglas de seguridad recomendadas para el estudio** (Firebase Console → Realtime Database → Reglas):
> ```json
> {
>   "rules": {
>     ".read": true,
>     ".write": true
>   }
> }
> ```
> Esto es suficiente para un estudio piloto con N=6. Para producción se recomienda agregar autenticación.

---

### Paso 2 — Anthropic Claude API

1. Ve a [https://console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión
3. En **API Keys** → Crear nueva clave
4. Copia la clave (comienza con `sk-ant-...`)

Edita `js/config.js`:

```js
ANTHROPIC_API_KEY: 'sk-ant-api03-XXXXXXXXXX...',
```

> **Nota de seguridad:** La API key queda expuesta en el frontend. Para un estudio piloto con N=6 participantes controlados esto es aceptable. Si la tesis se escala, migrar las llamadas a Claude a un backend (ej: Vercel Functions).

---

### Paso 3 — EmailJS (recordatorios)

1. Ve a [https://www.emailjs.com](https://www.emailjs.com) → Crear cuenta gratuita
2. **Email Services** → Add New Service → Gmail (o el que prefieras)
   - Sigue las instrucciones para conectar tu cuenta de correo del estudio
   - Copia el **Service ID** (ej: `service_abc123`)
3. **Email Templates** → Create New Template

   **Template de recordatorio de sesión** — nombre sugerido: `stresslab_reminder`
   ```
   Asunto: [StressLab UDD] Recordatorio: tu sesión de {{technique}} te espera

   Hola {{nickname}},

   Este es tu recordatorio para tu sesión de {{technique}} de hoy.

   Ingresa aquí: {{app_url}}

   ¡Recuerda completar el check-in antes y después de la sesión!

   Equipo StressLab UDD
   ```
   Copia el **Template ID** (ej: `template_xyz789`)

4. **Email Templates** → Create New Template

   **Template de resumen semanal** — nombre sugerido: `stresslab_weekly`
   ```
   Asunto: [StressLab UDD] Tu resumen de la semana 🌿

   Hola {{nickname}},

   Tu resumen de esta semana:
   - Sesiones realizadas: {{sessions_done}}
   - Adherencia: {{adherence}}%
   - Evolución de bienestar: {{wellbeing_summary}}

   {{motivational_message}}

   Ingresa aquí: {{app_url}}

   Equipo StressLab UDD
   ```
   Copia el **Template ID**

5. Ve a **Account** → **API Keys** → copia tu **Public Key** (ej: `user_XXXXXX`)

Edita `js/config.js`:

```js
EMAILJS: {
  publicKey:              'user_XXXXXX',
  serviceId:              'service_abc123',
  reminderTemplateId:     'template_xyz789',
  weeklySummaryTemplateId:'template_weekly_id',
},
```

---

### Paso 4 — Contraseña del investigador y códigos de participante

En `js/config.js`:

```js
RESEARCHER_PASSWORD: 'EligeTuContraseñaSegura2026',

VALID_CODES: ['TM-001', 'TM-002', 'TM-003', 'TM-004', 'TM-005', 'TM-006'],
```

Asigna un código único a cada participante al momento de la firma del consentimiento informado. Los códigos son case-insensitive en el input (se convierten a mayúsculas automáticamente).

---

### Paso 5 — Publicar en GitHub Pages

1. Crea un repositorio en GitHub (puede ser privado, pero GitHub Pages requiere cuenta Pro o repositorio público)
2. Sube todos los archivos:
   ```bash
   git init
   git add .
   git commit -m "StressLab UDD v1.0"
   git remote add origin https://github.com/TU_USUARIO/stresslab-udd.git
   git push -u origin main
   ```
3. En GitHub → Settings → Pages → Branch: `main` / Folder: `/ (root)` → Save
4. Tu app estará en: `https://TU_USUARIO.github.io/stresslab-udd/`

> ⚠️ **Antes de publicar:** Asegúrate de que `js/config.js` tiene las claves reales. Si el repositorio es público, considera usar un repositorio privado o variables de entorno mediante un backend mínimo.

---

## Flujo de uso para participantes

1. El participante recibe la URL de acceso (ej: `https://tu-usuario.github.io/stresslab-udd/`)
2. Ingresa su código (ej: `TM-001`) → redirige a `chat.html?code=TM-001`
3. El chatbot inicia el **onboarding**: presentación de técnicas, selección, configuración de horario y frecuencia
4. Durante el período intercertámenes el participante realiza sus sesiones guiadas por el chatbot
5. Antes de cada sesión: **check-in de bienestar** (estrés, energía, ánimo en escala 0-10)
6. Al finalizar: **check-in post-sesión** con los mismos ítems
7. Recibirá recordatorios por correo según su horario configurado
8. Al cerrar el período: **cuestionario de cierre** aplicado automáticamente por el chatbot

---

## Flujo de uso para el equipo investigador

1. Acceder a `index.html` → clic en "🔒 Acceso investigadores"
2. Ingresar la contraseña configurada en `config.js`
3. El panel muestra:
   - Tarjetas de resumen: participantes activos, cerrados, sesiones totales, adherencia global
   - Tabla de participantes: estado, técnica, sesiones, adherencia
   - Al hacer clic en "Ver": detalle individual con gráfico de bienestar (Chart.js), historial de sesiones y cuestionario de cierre
4. Exportación disponible:
   - **Exportar participantes** → CSV con datos de onboarding y adherencia por participante
   - **Exportar sesiones** → CSV con cada sesión (fecha, técnica, check-ins pre/post, duración)
5. **Resúmenes semanales** → envía email a todos los participantes activos con su resumen de la semana

---

## Consideraciones éticas

- **Sin diagnóstico clínico:** El chatbot no diagnostica ni trata condiciones de salud mental. Su rol es facilitar la práctica de técnicas de bienestar con respaldo científico.
- **Derivación automática:** Ante cualquier señal de malestar emocional significativo, el sistema deriva al participante al Servicio de Bienestar UDD (psicologia@udd.cl / 600 600 6222 int. 2500).
- **Anonimización:** Los datos se almacenan asociados al código alfanumérico, sin nombre real.
- **Consentimiento:** El uso de la herramienta está explicitado en el consentimiento informado aprobado por el Comité de Ética de la Universidad del Desarrollo.
- **Alcance acotado:** La herramienta opera exclusivamente como soporte para las intervenciones del estudio piloto (N=6), no como servicio clínico de uso masivo.

---

## Stack tecnológico

| Componente | Tecnología | Por qué |
|---|---|---|
| Hosting | GitHub Pages | Gratuito, estático, sin servidor |
| Base de datos | Firebase Realtime Database | SDK cliente JS, sin backend propio |
| IA conversacional | Claude API (claude-sonnet-4-20250514) | Contexto largo, lenguaje natural en español, capacidad de guiar sesiones |
| Emails | EmailJS | Envío desde frontend sin backend |
| Gráficos | Chart.js 4 | Ligero, sin dependencias |
| Fuentes | Lora + Nunito (Google Fonts) | Serif académico + sans-serif legible |

---

## Soporte técnico

Para consultas sobre la configuración o el funcionamiento de la herramienta, contactar al equipo investigador.

Proyecto desarrollado con asistencia de Claude (Anthropic) como parte del trabajo de tesis.
