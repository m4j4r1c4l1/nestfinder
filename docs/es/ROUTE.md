# 🚶 Función de Planificador de Rutas

## Descripción General

El Planificador de Rutas calcula el camino a pie óptimo para visitar los puntos seleccionados en el mapa. Utiliza un enfoque de **filtrado basado en la vista** para mantener las rutas manejables y relevantes.

---

## Cómo Funciona

### 1. Filtrado Basado en Vista
Las rutas se calculan **solo para los puntos visibles en pantalla**:
- Desplázate/haz zoom en el mapa hacia tu área objetivo
- Solo se incluyen los puntos en la vista actual
- Esto mantiene las rutas enfocadas y eficientes

### 2. Filtrado por Estado
Adicionalmente filtra por estado del punto:
- ✅ **Confirmado** — Ubicaciones verificadas
- ⏳ **Pendiente** — Esperando verificación
- ❌ **Desactivado** — Ya no está activo

### 3. Algoritmo del Vecino Más Cercano
La ruta se optimiza usando ordenamiento del vecino más cercano:
1. Comienza desde tu ubicación (si está disponible) o el primer punto
2. Visita el punto no visitado más cercano a continuación
3. Repite hasta que todos los puntos estén conectados

---

## Usando el Planificador de Rutas

1. **Navega** hacia tu área objetivo en el mapa
2. Toca **Ruta** 🚶 en la navegación inferior
3. **Activa/desactiva** los filtros de estado según necesites
4. Ve **"X puntos seleccionados"** (solo cuentan los puntos visibles)
5. Toca **"Calcular Ruta"**
6. Ve la ruta en el mapa con puntos de paso numerados

---

## Detalles Técnicos

### Proveedor de API
Las rutas se calculan usando [OSRM](https://router.project-osrm.org/) (Open Source Routing Machine):
- Direcciones en modo a pie
- Caminos reales por calles (no líneas rectas)
- Gratuito, sin necesidad de clave API

### Seguimiento de Límites del Mapa
```javascript
// Map.jsx - Componente BoundsTracker
map.on('moveend', updateBounds);
map.on('zoomend', updateBounds);
// Reporta: { north, south, east, west }
```

### Filtrado de Puntos
```javascript
// RoutePanel.jsx
const isPointInBounds = (point) => {
    return (
        point.latitude >= mapBounds.south &&
        point.latitude <= mapBounds.north &&
        point.longitude >= mapBounds.west &&
        point.longitude <= mapBounds.east
    );
};

// Filtro combinado: estado + vista
points.filter(p => statusFilter[p.status] && isPointInBounds(p));
```

### Algoritmos y Optimización

#### El Problema del Viajante (TSP)
El desafío de visitar múltiples nidos en el orden más eficiente es una variación del clásico [Problema del Viajante (TSP)](https://es.wikipedia.org/wiki/Problema_del_viajante). Aunque encontrar la ruta *absolutamente* perfecta es computacionalmente intensivo (NP-hard), NestFinder usa enfoques heurísticos para proporcionar un camino casi óptimo rápidamente.

#### Búsqueda de Caminos y Jerarquías de Contracción
Para calcular el camino real a pie entre dos puntos, dependemos de **OSRM**, que utiliza técnicas avanzadas:
- **Variantes del Algoritmo de Dijkstra**: En su núcleo, la búsqueda de caminos calcula el camino más corto en un grafo ponderado (red de carreteras).
- **Jerarquías de Contracción**: OSRM acelera significativamente esto usando [Jerarquías de Contracción](https://en.wikipedia.org/wiki/Contraction_hierarchies). Esta técnica pre-procesa el mapa para crear "atajos" entre nodos importantes, reduciendo el espacio de búsqueda de millones de nodos a unos pocos manejables, permitiendo cálculos de ruta en menos de un segundo.

---

## Consejos

| Consejo | Descripción |
|---------|-------------|
| **Acércate** | Menos puntos = cálculo más rápido |
| **Usa filtros** | Oculta estados irrelevantes para simplificar |
| **Re-centrar** | Toca 📍 para volver a tu ubicación |
| **Limpiar ruta** | Toca "Limpiar Ruta" para empezar de nuevo |

---

## Limitaciones

- Se recomiendan máximo ~25 puntos para rendimiento óptimo
- Requiere conexión a internet para la API de OSRM
- Solo rutas a pie (no para conducir/ciclismo)
