# 📱 Guía de Usuario de NestFinder

¡Bienvenido a **NestFinder**! Esta guía te ayudará a comenzar a usar la app en tu dispositivo móvil u ordenador.

---

**Contenido**
- [🚀 Primeros Pasos](#-primeros-pasos)
- [📍 Activar Servicios de Ubicación](#-activar-servicios-de-ubicación)
- [📖 Uso Diario](#-uso-diario)
  - [Vista del Mapa](#vista-del-mapa)
  - [Añadir un Punto](#añadir-un-punto)
  - [Verificar Puntos](#verificar-puntos)
  - [Planificar una Ruta](#planificar-una-ruta)
  - [Exportar Datos](#exportar-datos)
  - [Ver Mensajes](#ver-mensajes)
  - [Configuración e Idioma](#configuración-e-idioma)

---

## 🚀 Primeros Pasos

NestFinder es una aplicación web (PWA) que puedes usar directamente en tu teléfono sin pasar por la App Store ni instalar nada.

### Paso 1: Abre la App
Visita: [https://m4j4r1c4l1.github.io/nestfinder/](https://m4j4r1c4l1.github.io/nestfinder/)

<p align="center"><img src="../images/landing_02_home.jpg" width="240" alt="Pantalla de Inicio" /></p>

### Paso 2: Instalar en Pantalla de Inicio (Opcional)

> [!TIP]
> Instalar en tu pantalla de inicio es **opcional**. ¡La app funciona perfectamente en cualquier navegador! Instalarla solo facilita el acceso y ofrece una experiencia más similar a una app nativa.

#### 🍏 iOS (iPhone/iPad)
1. Toca el botón **Compartir** (cuadro con flecha) o **Menú** (tres puntos).
<p align="center">
  <img src="../images/ios_install_01_menu.jpg" width="160" alt="Menú" />
  <img src="../images/ios_install_02_share.jpg" width="160" alt="Compartir" />
</p>

2. Desplázate hacia abajo y toca **"Añadir a pantalla de inicio"**.
<p align="center"><img src="../images/ios_install_03_add.jpg" width="200" alt="Añadir a Pantalla de Inicio" /></p>

3. Toca **Añadir**.
<p align="center"><img src="../images/add_to_home_screen.jpg" width="200" alt="Toca Botón Añadir" /></p>

4. ¡Listo!
<p align="center"><img src="../images/ios_install_04_result.jpg" width="200" alt="Icono en Pantalla de Inicio" /></p>

#### 🤖 Android (Chrome/Brave)
*(Capturas de pantalla usando el navegador Brave)*

1. Toca el botón **Menú** (tres puntos).
<p align="center"><img src="../images/android_install_01_menu.jpg" width="200" alt="Menú Android" /></p>

2. Toca **"Añadir a pantalla de inicio"** (o "Instalar app").
<p align="center"><img src="../images/android_install_02_add_menu.jpg" width="200" alt="Añadir a Pantalla de Inicio" /></p>

3. Toca **Añadir** en el diálogo.
<p align="center">
  <img src="../images/android_install_03_create_shortcut.jpg" width="180" alt="Crear Acceso Directo" />
  <img src="../images/android_install_04_allow.jpg" width="180" alt="Permitir Acceso Directo" />
</p>

4. ¡Listo!
<p align="center"><img src="../images/android_install_05_result.jpg" width="200" alt="Pantalla de Inicio Android" /></p>

---

## 📍 Activar Servicios de Ubicación

Para encontrar recursos cerca de ti y usar la navegación de rutas, la app necesita tu ubicación.

> [!IMPORTANT]
> **Privacidad Primero**: Solo usamos tu ubicación para mostrar puntos cercanos y calcular rutas.

### iOS (iPhone)

1. Ve a **Ajustes** → **Privacidad y Seguridad**. Selecciona **Localización**.
<p align="center"><img src="../images/ios_step1_menu.jpg" width="250" alt="Menú Privacidad iOS" /></p>

2. Asegúrate de que **Localización** esté **ACTIVADA**.
<p align="center"><img src="../images/ios_step2_toggle.jpg" width="250" alt="Activar Localización iOS" /></p>

3. Desplázate hasta **Sitios web de Safari**.
<p align="center"><img src="../images/ios_step3_applist.jpg" width="250" alt="Lista de Apps iOS" /></p>

4. Selecciona **"Preguntar la próxima vez"** (o "Mientras se usa la app") y asegúrate de que **Ubicación exacta** esté ACTIVADA.
<p align="center"><img src="../images/ios_step4_permissions.jpg" width="250" alt="Permisos iOS" /></p>

### Android

1. Ve a **Ajustes** → **Ubicación**, asegúrate de que esté **ACTIVADA**, y revisa los permisos del navegador.
<p align="center">
  <img src="../images/android_location_settings_01_main.jpg" width="180" alt="Ajustes Ubicación Android" />
  <img src="../images/android_location_settings_02_permissions.jpg" width="180" alt="Permisos de Apps" />
</p>

2. Si ves la pantalla **Activar Ubicación**, toca el botón:
<p align="center"><img src="../images/android_location_01_overlay.jpg" width="200" alt="Overlay Activar Ubicación" /></p>

3. Cuando el navegador pregunte, selecciona tu preferencia y toca **Permitir**:
<p align="center"><img src="../images/android_location_02_permission.jpg" width="200" alt="Permiso del Navegador" /></p>

### Solución de Problemas
Si ves un banner morado diciendo "Activa tu Ubicación", toca el botón **Activar Ubicación**.

<p align="center"><img src="../images/landing_03_location_prompt.jpg" width="250" alt="Banner Activar Ubicación" /></p>

Si ves este mensaje del sistema de iOS, toca "**Permitir mientras se usa la app**":

<p align="center"><img src="../images/ios_system_permission_prompt.jpg" width="250" alt="Mensaje de Permiso del Sistema iOS" /></p>

Si aún no funciona, limpia la caché del navegador e inténtalo de nuevo. Consulta la guía completa de [Solución de Problemas de Geolocalización](GEOLOCATION.md).

---

## 📖 Uso Diario

### Vista del Mapa
La pantalla principal es el mapa.

- **Mi Ubicación**: Toca el botón 📍 (abajo a la derecha) para centrarte en tu posición.
- **Filtrar**: Toca el icono de la lupa 🔍 para mostrar solo puntos específicos (ej., solo confirmados).

<p align="center">
  <img src="../images/feature_01_filter_panel.jpg" width="200" alt="Panel de Filtros" />
  <img src="../images/map_view.jpg" width="200" alt="Vista Principal del Mapa" />
</p>

### Añadir un Punto
¡Ayuda a otros reportando recursos!

1. Toca **Reportar** en el menú inferior.
2. Elige una ubicación:
   - **Ubicación Actual**: Usa donde estás ahora.
   - **Seleccionar en Mapa**: Toca un punto en el mapa.
   - **Dirección**: Escribe la dirección manualmente.
<p align="center">
  <img src="../images/feature_02_report_gps.jpg" width="160" alt="Reportar GPS" />
  <img src="../images/feature_02_report_map.jpg" width="160" alt="Reportar Mapa" />
  <img src="../images/feature_02_report_address.jpg" width="160" alt="Reportar Dirección" />
</p>

3. Añade detalles (etiquetas, notas).
4. Toca **Enviar**.
   
### Verificar Puntos
¡Toca cualquier marcador en el mapa para ver detalles. Ayudas a la comunidad verificando reportes!
- **Confirmar Activo**: Toca esto si encuentras el nido/recurso.
- **Reportar Inactivo**: Toca esto si ya no está o está vacío.

<p align="center"><img src="../images/point_details.jpg" width="240" alt="Detalles del Punto" /></p>

#### Flujo de Estados de Puntos
Los puntos pasan por diferentes estados según las acciones de la comunidad:

<p align="center"><img src="../images/point_status_flow_es.png" width="400" alt="Diagrama de Flujo de Estados" /></p>

### Planificar una Ruta
Encuentra el mejor camino a pie para visitar múltiples lugares.
1. Mueve el mapa para mostrar el área que quieres visitar.
2. Toca **Ruta** 🚶.
3. Toca **Calcular Ruta** ¡y sigue el camino numerado!

<p align="center">
  <img src="../images/feature_03_route_panel.jpg" width="180" alt="Panel de Ruta" />
  <img src="../images/feature_03_route_map.jpg" width="180" alt="Resultado de Ruta" />
</p>

### Exportar Datos
Puedes descargar los puntos visibles para otros usos.
1. Toca **Descargar** ⬇️.
2. Selecciona **JSON**, **CSV**, **GPX** o **KML**.

<p align="center"><img src="../images/feature_04_download_panel.jpg" width="240" alt="Panel de Descarga" /></p>

### Ver Mensajes
Revisa el **Buzón** para actualizaciones sobre puntos que has reportado o a los que te has suscrito.

<p align="center">
  <img src="../images/feature_05_inbox_panel.jpg" width="180" alt="Panel de Buzón" />
  <img src="../images/feature_05_inbox_popup.jpg" width="180" alt="Popup de Buzón" />
</p>

Los mensajes no leídos se mostrarán con una insignia:
<p align="center"><img src="../images/feature_05_inbox_notification_badge.jpg" width="360" alt="Insignia de Buzón" /></p>

### Configuración e Idioma
Toca **Configuración** ⚙️ para:
- Cambiar Idioma (EN, ES, FR, PT, etc.)
- Cambiar estilo de notificaciones (alertas emergentes vs. buzón silencioso)

<p align="center"><img src="../images/settings_panel.jpg" width="240" alt="Panel de Configuración" /></p>
