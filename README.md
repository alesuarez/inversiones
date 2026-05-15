# Simulador de Retiro / Jubilación

Aplicación web estática para simular escenarios financieros de retiro mediante inversión con interés compuesto.

## Características

- Proyección de acumulación de capital con interés compuesto mensual
- Simulación de retiro mensual durante la jubilación
- Comparación inversión vs ahorro tradicional (sin interés)
- Gráfico interactivo con Chart.js
- Tabla detallada año a año
- Métricas: capital máximo, interés generado, duración del retiro, edad de agotamiento
- Compartir simulación vía link con parámetros en URL
- Recalculo automático al modificar parámetros
- Persistencia en LocalStorage
- Diseño responsive

## Publicar con GitHub Pages

1. Crea un repositorio en GitHub
2. Sube todos los archivos del proyecto:
   ```
   git init
   git add .
   git commit -m "Primer commit"
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```
3. Ve a **Settings > Pages** del repositorio
4. En **Source**, selecciona **Deploy from a branch**
5. Branch: `main`, Folder: `/ (root)`
6. Haz clic en **Save**

La aplicación estará disponible en:
`https://TU_USUARIO.github.io/TU_REPO/`

## Tecnologías

- HTML5 / CSS3
- JavaScript (ES5+)
- Chart.js 4.4.1 (CDN)
- Canvas API

## Estructura del proyecto

```
├── index.html
├── .nojekyll
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── utils.js
    ├── simulator.js
    ├── charts.js
    └── app.js
```
