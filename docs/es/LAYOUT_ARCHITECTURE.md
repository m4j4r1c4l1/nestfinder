# Bottom Sheet Modal - Arquitectura de Layout

## Descripción General
Este documento explica la solución de layout para el sistema de modales de bottom sheet usado en todos los paneles de NestFinder (Ruta, Configuración, Filtro, Enviar, Descargar, Notificaciones).

## Estructura

### Arquitectura Actual (2 Capas)
```
┌─────────────────────────────────────────┐
│ .bottom-sheet (ROJO - Contenedor Modal) │
│ ├── .bottom-sheet-handle (Barra arrastre)│
│ └── .card (VERDE - Panel de Contenido)  │
│     └── .card-body (CYAN - Interior)    │
└─────────────────────────────────────────┘
```

### Archivos
- **Estructura JSX**: `client/src/pages/MapView.jsx` (líneas 305-382)
- **Estilos CSS**: `client/src/index.css` (líneas 528-610)

## Contexto Histórico

### Arquitectura Anterior (3 Capas) ❌
```
.bottom-sheet (Rojo)
  └── .bottom-sheet-content (Azul wrapper)
      └── .card (Verde)
          └── .card-body (Cyan)
```

### Por Qué Se Eliminó el Wrapper Azul
El wrapper `.bottom-sheet-content` fue diseñado inicialmente para:
- Manejo de overflow con scroll
- Padding consistente alrededor del contenido
- Separación entre el handle fijo y el contenido con scroll

**Sin embargo, causó un problema crítico:**
- La caja Azul tenía `flex: 1 1 auto` para llenar el espacio disponible
- La caja Roja usaba `justify-content: center` para centrar hijos
- Resultado: **Azul + Handle llenaban toda la caja Roja**, sin dejar espacio para centrar
- Incluso con `flex: 0 1 auto` + `margin: auto`, Azul permanecía pegado al fondo

**Solución:** Se eliminó el wrapper Azul completamente, moviendo sus propiedades a Rojo.

## Solución Actual

### Centrado Vertical
```css
.bottom-sheet {
  display: flex;
  flex-direction: column;
  /* SIN justify-content: center */
  overflow-y: auto;
}

.bottom-sheet > .card {
  margin: auto 0;  /* Centrado vertical */
  flex: 0 1 auto;  /* Altura natural */
}
```

**Cómo funciona:**
1. **Contenido corto**: `margin: auto 0` centra la tarjeta verticalmente dentro de Rojo
2. **Contenido alto**: La tarjeta crece naturalmente, Rojo hace scroll con `overflow-y: auto`

### ¿Por Qué No `justify-content: center`?
```
justify-content: center + overflow-y: auto = ⚠️ PELIGRO
```

Cuando el contenido desborda, `justify-content: center` puede:
- Recortar contenido superior (inalcanzable)
- Iniciar scroll desde el "punto central" en lugar del top
- Crear mala UX para paneles altos

Usando `margin: auto 0` en su lugar:
- ✅ Centra contenido corto
- ✅ Permite scroll completo de arriba a abajo
- ✅ Sin recorte de contenido

## Desglose de Propiedades CSS

### Caja Roja (`.bottom-sheet`)
```css
max-height: calc(100vh - 150px);  /* Cabe en pantalla con nav */
padding: var(--space-4);          /* 16px de espaciado */
padding-top: 0;                   /* Permite handle tocar arriba */
overflow-y: auto;                 /* Scroll cuando es alto */
display: flex;
flex-direction: column;
```

### Tarjeta Verde (`.bottom-sheet > .card`)
```css
margin: auto 0;      /* Centrado vertical */
flex: 0 1 auto;      /* Crece según contenido, puede encogerse */
max-height: none;    /* Sin restricción de altura */
overflow: visible;   /* No recortar contenido */
```

### Cuerpo Cyan (`.bottom-sheet > .card .card-body`)
```css
padding: var(--space-4);           /* 16px todos lados */
padding-bottom: var(--space-10);   /* 40px elevación inferior */
display: flex;
flex-direction: column;
justify-content: center;           /* Centrar elementos del formulario */
```

## Depuración

### Colores de Depuración Visual
Habilitados en desarrollo vía comentarios CSS:
- 🔴 **Rojo**: `.bottom-sheet` (contenedor exterior)
- 🟢 **Verde**: `.card` (contenedor del panel)
- 🟦 **Cyan**: `.card-body` (contenido interior)

Para habilitar:
```css
/* DEBUG: ROJO - Contenedor Sheet Exterior */
border: 4px solid red !important;
background: rgba(255, 0, 0, 0.15) !important;
```

### Problemas Comunes

**Problema**: Contenido tocando el fondo de la caja Roja
- **Causa**: Falta `margin: auto 0` en la tarjeta Verde
- **Solución**: Asegurar que `.bottom-sheet > .card` tenga `margin: auto 0`

**Problema**: No se puede hacer scroll hasta arriba del contenido
- **Causa**: Usar `justify-content: center` con `overflow`
- **Solución**: Quitar `justify-content`, usar `margin: auto` en su lugar

**Problema**: Contenido no centrado cuando es corto
- **Causa**: Falta `flex: 0 1 auto` en la tarjeta Verde
- **Solución**: Asegurar que la tarjeta tenga altura natural, no `flex: 1`

## Notas de Migración

Si necesitas añadir un nuevo panel:
1. Añade el componente del panel a `MapView.jsx` dentro del div `.bottom-sheet`
2. Asegúrate de que el componente retorne un elemento `.card`
3. No se necesita wrapper - la tarjeta es hijo directo de la caja Roja
4. El centrado y scroll funcionan automáticamente

## Referencias

- **Historial de Commits**:
  - `2b5fee5`: Se eliminó wrapper Azul
  - `1a1c3d3`: Se arregló scroll con centrado seguro
  - `c0ded91`: Intentos iniciales con flex (supersedidos)

- **Issues Relacionados**: Alineación de panel, centrado vertical, comportamiento de scroll
