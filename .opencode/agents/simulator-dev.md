# Agente: Simulador de Retiro / Jubilación

Agente especializado para mantener y extender el simulador financiero de retiro con interés compuesto.

## Descripción del Proyecto

Aplicación web **100% client-side** (HTML/CSS/JS vanilla) que simula escenarios financieros de retiro mediante inversión con interés compuesto. Corre localmente o en cualquier static host (GitHub Pages, Netlify, Vercel).

## Stack Tecnológico

| Tecnología | Versión/Detalle |
|---|---|
| HTML5 | Semántico, sin frameworks |
| CSS3 | Flexbox/Grid, diseño responsive, dark theme |
| JavaScript | ES5+ (uso de `var`, sin módulos ES6 ni bundlers) |
| Chart.js | v4.4.1 vía CDN (`chart.umd.min.js`) |
| Persistencia | `localStorage` (solo guarda últimos parámetros) |
| Sin backend | Totalmente estático |

## Arquitectura del Código

```
/index.html          → Punto de entrada, layout, formulario, contenedores
/css/styles.css      → Todo el CSS (responsive, dark theme, animaciones)
/js/utils.js         → Utilidades: formatCurrency, debounce, storage, monthlyRateFromAnnual
/js/simulator.js     → Motor financiero (desacoplado de UI): function simulate(params)
/js/charts.js        → Renderizado de Chart.js: function renderChart(canvasId, investedTL, nonInvestedTL, retirementAge)
/js/app.js           → Orquestador: cacheDOM, calcular, renderSummary, renderTable, init
```

### Flujo de ejecución

1. `app.js:init()` → cachea referencias DOM, restaura localStorage, enlaza eventos `input` con debounce(300ms), llama `calcular()`
2. `app.js:calcular()` → lee inputs, construye `params`, llama `simulate(params)`, renderiza resumen/tabla/gráfico, guarda en localStorage
3. `simulator.js:simulate(params)` → ejecuta los dos escenarios (con/sin inversión), retorna `{ invested, nonInvested, comparison }`
4. `charts.js:renderChart()` → dibuja Chart.js con líneas comparativas + línea vertical de retiro
5. `utils.js` → formateo, conversión tasa anual→mensual, debounce, localStorage

## Convenciones de Código

- **Lenguaje**: JavaScript ES5 (`var`, function expressions, no arrow functions, no template literals)
- **Nombres**: camelCase para variables/funciones, mayúsculas para constantes globales (`EDAD_MAXIMA`, `STORAGE_KEY`)
- **Formateo**: Sin puntos y coma al final de funciones
- **DOM Cache**: Objeto global `DOM` poblado por `cacheDOM()`
- **Estado global**: `var currentResult = null;` en app.js
- **Selector de fase**: Clases CSS `tag-acum`, `tag-retiro`, `tag-agotado`, `tag-inicio` para colorear filas de tabla
- **Colores semánticos**: verde = crecimiento, rojo = agotamiento, azul = aportes, gris/ámbar = neutral
- **No usar**: ES6 modules, import/export, bundlers, frameworks, TypeScript, arrow functions
- **NO agregar comentarios al código a menos que se pida explícitamente**

## Estructura de Datos

### Parámetros de entrada (`simulate(params)`)

```js
{
  currentAge: number,        // Edad actual
  retirementAge: number,     // Edad de retiro
  maxAge: number,            // Edad máxima (hardcoded 120 en app.js)
  initialCapital: number,    // Capital inicial
  monthlyContribution: number, // Aporte mensual
  annualReturnRate: number,  // Tasa anual (%)
  monthlyWithdrawal: number  // Retiro mensual en jubilación
}
```

### Timeline (cada punto mensual)

```js
{
  age: number,               // Edad (decimal, ej: 45.5)
  month: number,             // Mes desde inicio (0-index)
  phase: string,             // "inicio" | "acumulación" | "retiro" | "agotado"
  capital: number,           // Capital redondeado
  interestGenerated: number, // Interés generado este mes
  contribution: number,      // Aporte este mes
  withdrawal: number,        // Retiro este mes
  totalContributions: number // Total aportado históricamente
}
```

### Salida de `simulate()`

```js
{
  invested: { timeline: [], metrics: {} },
  nonInvested: { timeline: [], metrics: {} },
  comparison: {
    differenceAbsolute: number,
    differencePercent: number,
    investedRunsOutAt: number|null,
    nonInvestedRunsOutAt: number|null
  }
}
```

### Métricas (`invested.metrics`)

```js
{
  totalContributed, totalWithdrawn, totalInterestGenerated,
  maxCapital, ageAtMaxCapital, capitalAtRetirement,
  monthlyInterestAtRetirement, monthlyWithdrawal,
  ageAtDepletion, retirementDuration, isSustainable
}
```

## Funciones Clave

| Función | Archivo | Propósito |
|---|---|---|
| `simulate(params)` | simulator.js:1 | Motor financiero principal |
| `makePoint(age, month, phase, ...)` | simulator.js:178 | Crea un punto de timeline |
| `monthlyRateFromAnnual(annualPercent)` | utils.js:54 | Convierte tasa anual → mensual |
| `renderChart(canvasId, investedTL, nonInvestedTL, retirementAge)` | charts.js:3 | Dibuja gráfico Chart.js |
| `buildRetirementPlugin(retireIdx, retirementAge)` | charts.js:151 | Plugin para línea vertical de retiro |
| `calcular()` | app.js:20 | Orquestador principal |
| `renderSummary(result)` | app.js:55 | Renderiza tarjetas de métricas |
| `renderTable(result)` | app.js:129 | Renderiza tabla de timeline |
| `debounce(fn, delay)` | utils.js:41 | Evita recalculos excesivos |
| `formatCurrency(value)` | utils.js:1 | "$1.234.567" |
| `aplicarEscenario(tipo)` | app.js:195 | Carga escenario preconfigurado |
| `resetear()` | app.js:212 | Valores por defecto |

## Estado Actual (Implementado vs Requerimientos)

### ✅ Implementado
- RF-001 a RF-016 (edad, capital, aporte, rendimiento, conversión interés, acumulación, retiro, comparación sin inversión, métricas, gráfico, tabla, recálculo automático, escenarios, responsive)
- RV-001 a RV-004 (dashboard, gráfico comparativo, colores semánticos, tooltips)
- RNF-001 a RNF-005 (performance, precisión, sin backend, desacoplamiento, mantenibilidad)

### ❌ No implementado / Mejoras pendientes
| ID | Feature | Prioridad |
|---|---|---|
| RF-015-ext | Edad máxima configurable por usuario (hoy hardcoded 120) | Media |
| MF-001 | Inflación ajustable anualmente | Alta |
| MF-002 | Rendimiento variable por etapa (ej: diferente % antes/después del retiro) | Alta |
| MF-003 | Simulación Monte Carlo (múltiples escenarios aleatorios) | Baja |
| MF-004 | Exportación a PDF / CSV / Excel | Media |
| MF-005 | Persistencia de múltiples simulaciones (no solo la última) | Media |
| MF-006 | Compartir simulación vía URL con parámetros en query string | Baja |
| RNF-002 | Usar Big.js para precisión financiera | Baja |
| — | Tests unitarios (no existe suite de tests) | Media |
| — | Migrar a ES6 modules (ESM) para mejor organización | Baja |

## Cómo Agregar una Nueva Feature

1. **Actualizar el HTML** (`index.html`): agregar inputs en `.grid`, cards en `.summary`, o filas en la tabla según corresponda. Dar IDs semánticos a los nuevos elementos.
2. **Actualizar el CSS** (`css/styles.css`): agregar estilos respetando el dark theme existente. Usar colores de la paleta: `#4ade80` (verde), `#f87171` (rojo), `#60a5fa` (azul), `#fbbf24` (ámbar), `#888` (gris).
3. **Actualizar el motor** (`js/simulator.js`): agregar nuevos parámetros a `simulate(params)`, modificar el loop mensual, agregar nuevas métricas.
4. **Actualizar la UI** (`js/app.js`): leer nuevos inputs en `calcular()`, mostrar nuevas métricas en `renderSummary()` o nueva tabla en `renderTable()`.
5. **Actualizar gráficos** (`js/charts.js`): agregar datasets al Chart.js si es necesario.
6. **Utilidades** (`js/utils.js`): agregar helpers de formateo si hacen falta.

## Guía de Estilos Visuales

### Paleta de colores
- Fondo: `#0f0c29` → `#302b63` → `#24243e` (gradiente)
- Cards: `rgba(255,255,255,0.06)` con borde `rgba(255,255,255,0.06)`
- Verde (crecimiento): `#4ade80`
- Rojo (agotamiento/retiro): `#f87171`
- Azul (info/aporte): `#60a5fa`
- Amarillo (interés/alerta): `#fbbf24`
- Texto: `#e0e0e0`, labels: `#888`

### Responsive breakpoints
- `@media (max-width: 700px)`: container padding 20px, grid 2 columnas, chart 260px, botones en columna
- `@media (max-width: 450px)`: grid y summary 1 columna

### Chart.js config
- Type: `line`, fill suave, tension 0.3
- Punto fino (radius 2), hover radius 6
- Ejes con grid sutil `rgba(255,255,255,0.04)`
- Tooltip con fondo oscuro `rgba(15,12,41,0.95)`
- Línea vertical de retiro con plugin `afterDraw` (dashed, ámbar)

## Reglas para el Agente

1. **Nunca cambiar la arquitectura ES5 a ES6+ modules** a menos que se indique explícitamente. El proyecto usa script tags en orden en el HTML.
2. **Mantener el desacoplamiento**: `simulator.js` no debe tocar el DOM ni depender de nada fuera de sus parámetros de entrada.
3. **Preservar el cálculo mensual existente**: cualquier modificación al loop de simulación debe mantener la estructura de timeline existente para que charts.js y app.js sigan funcionando.
4. **Formateo consistente**: siempre usar `Math.round()` en valores monetarios, formatear con `toLocaleString('es-ES')`.
5. **No introducir dependencias externas** sin verificar que sean compatibles con carga vía CDN en `<script>` tag.
6. **Validaciones de entrada**: usar `getAge()`, `getMoney()`, `getRate()` de utils.js, nunca validar directamente en app.js.
7. **ID de elementos HTML existentes** que NO deben cambiar: `edad`, `retiro`, `capital`, `interes`, `aporte`, `retiroMensual`, `chart`, `tablaBody`, `totalAportado`, `totalRetirado`, `interesTotal`, `capitalMaximo`, `valorAlRetiro`, `valorAlRetiroNI`, `diferenciaAbsoluta`, `diferenciaPorcentual`, `retiroMensualDisplay`, `interesMensualRetiro`, `explicacionTexto`, `duracionRetiro`, `edadAgotamiento`, `duracionSinInteres`, `edadSinInteres`.
8. **Probar cambios**: el proyecto no tiene suite de tests automatizados. Probar manualmente abriendo `index.html` en navegador.
9. **Performance**: todo el pipeline (simulate → renderSummary → renderTable → renderChart) debe completarse en <100ms. Evitar bucles innecesarios dentro de los cálculos mensuales.

## Glosario de IDs del DOM

| ID | Tipo | Propósito |
|---|---|---|
| `edad` | input | Edad actual |
| `retiro` | input | Edad de retiro |
| `capital` | input | Capital inicial |
| `interes` | input | Tasa anual % |
| `aporte` | input | Aporte mensual |
| `retiroMensual` | input | Retiro mensual |
| `chart` | canvas | Gráfico Chart.js |
| `tablaBody` | tbody | Cuerpo de tabla temporal |
| `totalAportado` | div | Métrica: total aportado |
| `totalRetirado` | div | Métrica: total retirado |
| `interesTotal` | div | Métrica: interés total generado |
| `capitalMaximo` | div | Métrica: capital máximo alcanzado |
| `valorAlRetiro` | div | Métrica: capital al retiro (con interés) |
| `valorAlRetiroNI` | div | Métrica: capital al retiro (sin interés) |
| `diferenciaAbsoluta` | div | Métrica: diferencia $ |
| `diferenciaPorcentual` | div | Métrica: diferencia % |
| `retiroMensualDisplay` | div | Métrica: retiro mensual |
| `interesMensualRetiro` | div | Métrica: interés mensual al retiro |
| `explicacionTexto` | div | Explicación sustentabilidad |
| `duracionRetiro` | div | Duración con interés |
| `edadAgotamiento` | div | Edad agotamiento con interés |
| `duracionSinInteres` | div | Duración sin interés |
| `edadSinInteres` | div | Edad agotamiento sin interés |
| `cardExplicacion` | div | Card contenedor de explicación |
