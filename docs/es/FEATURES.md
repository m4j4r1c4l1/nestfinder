# 🛠️ Características y Documentación Técnica de NestFinder

Este documento proporciona una descripción técnica detallada de las características, arquitectura y capacidades de la aplicación.

---

**Contenido**
- [🏗️ Visión General de la Arquitectura](#️-visión-general-de-la-arquitectura)
- [🗺️ Características Principales](#️-características-principales)
- [🔒 Seguridad y Privacidad](#-seguridad-y-privacidad)
- [📥 Exportación de Datos](#-exportación-de-datos)

---

## 🏗️ Visión General de la Arquitectura

NestFinder está construida como una **Aplicación Web Progresiva (PWA)** usando una pila moderna de React.

- **Frontend**: React 18, Vite, Leaflet (Mapas)
- **API Backend**: Node.js, Express
- **Base de Datos**: SQLite (vía `sql.js` para manejo de datos efímeros/portables)
- **Tiempo Real**: WebSockets para actualizaciones de puntos y notificaciones en vivo

---

## 🗺️ Características Principales

### 1. Sistema de Mapa Interactivo
La interfaz principal está construida sobre **Leaflet.js**, optimizada para rendimiento móvil.
- **Agrupación de Marcadores**: Agrupa automáticamente puntos en niveles de zoom altos para evitar saturación.
- **Iconos Personalizados**: Marcadores basados en SVG que indican estado (Verde=Confirmado, Naranja=Pendiente, Gris=Desactivado).
- **Seguimiento de Usuario**: Seguimiento de ubicación GPS en tiempo real con actualizaciones continuas.
- **Geocodificación Inversa**: Convierte automáticamente coordenadas GPS a direcciones legibles (Ciudad, Calle).

### 2. Sistema de Estados y Verificación
Gestión del ciclo de vida de puntos para asegurar la precisión de los datos:
- **Pendiente (⏳)**: Puntos recién enviados.
- **Confirmado (✅)**: Verificado por otros usuarios.
- **Desactivado (❌)**: Marcado como ya no válido.
- **Lógica**: Los usuarios pueden "Confirmar" o "Reportar Inactivo" en cualquier punto. El sistema rastrea conteos de confirmación.

### 3. Planificador de Rutas Inteligente
Rutas a pie optimizadas usando **OSRM (Open Source Routing Machine)**.
- **Filtrado por Vista**: Solo calcula rutas para puntos actualmente visibles en la pantalla.
- **Algoritmo del Vecino Más Cercano**: Ordena los puntos para crear un camino eficiente desde la ubicación del usuario.
- **Filtrado por Estado**: Opción para incluir/excluir puntos pendientes o desactivados en la ruta.
- **Retroalimentación Visual**: Líneas discontinuas para caminos a pie y puntos de paso numerados para el orden.

### 4. Internacionalización (i18n)
Soporte completo para **11 Idiomas** usando un sistema de traducción flexible.
- **Idiomas**: Inglés, Español, Francés, Portugués, Valenciano, Italiano, Alemán, Holandés, Ruso, Árabe, Chino.
- **Detección Automática**: Detecta automáticamente el idioma del navegador en la primera carga.
- **Cambio Dinámico**: Cambio instantáneo de idioma sin recargar la página.

### 5. Interfaz de Reportes
Un sistema de envío versátil que soporta tres modos:
- **Modo GPS**: Usa la geolocalización del dispositivo.
- **Modo Mapa**: Toca para seleccionar coordenadas específicas.
- **Modo Dirección**: Entrada manual de dirección con geocodificación.
- **Etiquetas Rápidas**: Categorización rápida (Una Persona, Múltiples, Niños, Animales).

### 6. Sistema de Notificaciones
Funciones de participación del usuario en tiempo real.
- **Notificaciones en la App**: Sistema de buzón persistente para almacenar mensajes y actualizaciones.
- **Popups Toast**: Mensajes emergentes en tiempo real no intrusivos para retroalimentación inmediata.
- **Almacenamiento de Mensajes**: Todas las notificaciones almacenadas en el buzón para visualización posterior.
- **Difusiones del Admin**: Soporte para anuncios a nivel de sistema para todos los usuarios.

### 7. Capacidades PWA Offline
Diseñada para entornos de baja conectividad.
- **Service Worker**: Almacena en caché los recursos de la app para carga offline.
- **Instalable**: Cumple criterios para "Añadir a Pantalla de Inicio" en iOS y Android.
- **Responsiva**: Diseño mobile-first que se adapta a todos los tamaños de pantalla.

---

## 🔒 Seguridad y Privacidad

- **Autenticación Anónima**: Autenticación basada en UUID que no requiere creación de cuenta ni datos personales.
- **Sanitización de Entrada**: Protección contra XSS e inyección SQL.
- **Limitación de Tasa**: Protección de API contra spam/abuso.
- **CORS Configurado**: Políticas de origen estrictas para acceso a la API.

---

## 📥 Exportación de Datos

- **JSON**: Exportación jerárquica completa de datos.
- **CSV**: Exportación compatible con hojas de cálculo para análisis.
- **GPX/KML**: Formatos compatibles con GIS para uso con otras herramientas de mapeo.
- **Formato Legible**: JSON formateado para legibilidad humana.

---

## 🆕 Nuevas Características (v2.0)

### 8. Sistema de Confianza Guardian 🏆
Un sistema de gamificación que recompensa a los contribuidores activos.
- **Puntuación de Confianza**: Gana puntos (+5 por envíos aprobados, +1 por confirmaciones).
- **Voto Ponderado**: Los usuarios de alta confianza ("Guardianes" con 50+ puntos) tienen 3x poder de voto.
- **Niveles de Insignia**: Progresa desde Polluelo 🥚 → Gorrión 🐦 → Búho 🦉 → Águila 🦅.
- **Visualización de Perfil**: Ve tu estado y puntuación en Ajustes.

### 9. Interfaz de Voz 🎙️
Reportes manos libres para accesibilidad y conveniencia.
- **API Web Speech**: Convierte voz a texto para notas.
- **Botón de Micrófono**: Integrado en el formulario de envío.
- **Multi-idioma**: Respeta la configuración de idioma del dispositivo.

### 10. Recuperación de Identidad Anónima 🔑
Restaura tu cuenta en un nuevo dispositivo sin datos personales.
- **Claves de 3 Palabras**: Frases fáciles de recordar (ej: "águila-bosque-amanecer").
- **Genera en Ajustes**: Crea y guarda tu clave.
- **Multi-dispositivo**: Usa la clave para recuperar tu historial completo y puntuación.

### 11. Sistema de Difusión Global 📢
Anuncios del administrador para todos los usuarios.
- **Visualización Retrasada**: Las difusiones aparecen 1 segundo después de establecerse en el mapa.
- **Lógica de Ver Una Vez**: Los usuarios solo ven cada difusión una vez (almacenada en localStorage).
- **Controles de Admin**: Crear, programar y eliminar difusiones desde el Panel de Admin.

### 12. Canal de Retroalimentación 💌
Comunicación directa con los desarrolladores.
- **Selección de Tipo**: Reporta errores 🐛, sugiere ideas 💡, u otra retroalimentación.
- **Formulario en la App**: Accesible desde Ajustes.
- **Buzón de Admin**: Toda la retroalimentación visible en el Panel de Admin.

### 13. Modo Offline Mejorado 🗺️
Capacidades "NestFinder en Cualquier Lugar" mejoradas.
- **Caché de Mapas Expandida**: 2000 tiles de mapa almacenadas para visualización offline.
- **Caché de API**: Datos de puntos almacenados durante 24 horas.
- **Modo Lite**: Actívalo en Ajustes para desactivar animaciones y mejor rendimiento.
- **Cola Offline**: Acciones en cola cuando está offline y sincronizadas al reconectar.

