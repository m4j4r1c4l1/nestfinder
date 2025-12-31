# 📍 Solución de Problemas de Geolocalización

Esta guía es para solucionar problemas específicos de ubicación. Para la configuración general, consulta la [Guía de Usuario](USER_GUIDE.md).

## Problema: "Acceso a Ubicación Denegado"

Si ves un error diciendo que la ubicación fue denegada o bloqueada, lo más común es que sea causado por ajustes del sistema o de la app que tienen la ubicación desactivada. Si has usado la app antes, también podría ser que tu navegador guardó una respuesta "No" de una visita anterior.

### 🍏 Solución para iOS (iPhone/iPad)

**Safari en iOS tiene dos niveles de permisos:**

1. **Nivel del Sistema**:
   - Ve a **Ajustes** → **Privacidad y Seguridad** → **Localización**.
   <p align="center"><img src="../images/ios_step1_menu.jpg" width="250" /></p>
   
   - Asegúrate de que esté **ACTIVADO**.
   <p align="center"><img src="../images/ios_step2_toggle.jpg" width="250" /></p>

2. **Nivel del Navegador (Safari)**:
   - En el mismo menú, desplázate hasta **Sitios web de Safari**.
   <p align="center"><img src="../images/ios_step3_applist.jpg" width="250" /></p>
   
   - Configúralo como **"Mientras se usa la app"** (o "Preguntar la próxima vez") y marca **Ubicación exacta**.
   <p align="center"><img src="../images/ios_step4_permissions.jpg" width="250" /></p>
   
   - *Si está configurado como "Nunca", Safari bloqueará automáticamente todos los sitios.*

3. **Método 2: Configuración Global de Safari**:
   - Ve a **Ajustes** y busca **Safari** (o busca en Apps).
   <p align="center"><img src="../images/ios_safari_app_search.jpg" width="250" /></p>
   
   - Desplázate hasta **Configuración de sitios web** y toca **Ubicación**.
   <p align="center"><img src="../images/ios_safari_settings_location.jpg" width="250" /></p>
   
   - Asegúrate de que esté configurado como **"Preguntar"** o "Permitir".
   <p align="center"><img src="../images/ios_safari_global_policy.jpg" width="250" /></p>

**Para eliminar un bloqueo específico:**
1. Ve a **Ajustes** → **Safari** → **Avanzado** → **Datos de sitios web**.
2. Busca `nestfinder` o `github`.
3. Desliza hacia la izquierda para **Eliminar**.
4. Recarga la página y toca "Permitir" cuando se te pregunte.

### 🤖 Solución para Android (Chrome)

1. Abre **Chrome**.
2. Toca **Menú (⋮)** → **Configuración** → **Configuración de sitios**.
3. Toca **Ubicación**.
4. Comprueba si `nestfinder` está en la lista de "Bloqueados".
5. Toca el sitio y selecciona **Permitir**.

**Para limpiar la caché:**
1. Toca el icono de candado 🔒 en la barra de direcciones.
2. Toca **Permisos** → **Restablecer permisos**.

---

## Problema: "Ubicación No Disponible" o Tiempo de Espera Agotado

1. **Comprueba el GPS**: Asegúrate de que el GPS/Ubicación de tu teléfono esté realmente activado.
2. **Sal al exterior**: A veces las señales GPS son débiles en interiores.
3. **Recarga**: Vuelve a cargar la página e inténtalo de nuevo.

---

## ¿Sigue Sin Funcionar?

¡Aún puedes usar la app!

- **Modo Manual**: Al reportar un punto, elige "**Seleccionar en Mapa**" para colocar un marcador manualmente sin necesidad de GPS.
