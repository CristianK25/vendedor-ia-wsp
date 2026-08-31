# 🚀 Guía de Arquitectura y Desarrollo: Catálogo Público Satélite (Next.js SSR)

Este documento detalla la planificación técnica, estructura de archivos, diseño visual, requisitos de infraestructura y el paso a paso metodológico para desarrollar la aplicación pública de catálogo de **AutoLead CRM** utilizando **Next.js**.

---

## 1. 🎯 Objetivos y Análisis de Requerimientos

### 1.1. Propósito de Negocio
Crear una interfaz web pública, moderna y de alto rendimiento que exponga únicamente el stock de vehículos disponibles para clientes finales y prospectos. Debe funcionar como la carta de presentación comercial de la concesionaria, accesible mediante enlaces directos, redes sociales y compartida automáticamente por el agente de WhatsApp (n8n).

### 1.2. Requerimientos Funcionales
1. **Página de Catálogo General (`/`)**:
   * Grilla interactiva de vehículos en estado `disponible`.
   * Buscador en tiempo real por texto (marca, modelo, versión).
   * Filtros rápidos: Rango de precio (moneda USD/ARS), rango de año, kilometraje, tipo de transmisión (manual/automática), tipo de combustible y carrocería (sedán, suv, pickup, etc.).
   * Ordenamiento por precio (menor/mayor), año y kilometraje.
   * Paginación limpia y optimizada.
2. **Página de Detalle del Vehículo (`/vehiculos/[id]`)**:
   * Galería de fotos con visualizador principal y carrusel/lightbox.
   * Ficha técnica detallada (año, kilómetros, motor, tracción, combustible, color, etc.).
   * Descripción comercial y equipamiento destacado.
   * **Botón de Acción Directo (Call To Action - CTA):** *"Consultar por WhatsApp sobre este vehículo"*, con enlace automático (`https://wa.me/...`) que envíe un mensaje predefinido con el ID, marca, modelo y precio.
3. **Optimización SEO y OpenGraph (Meta-etiquetas SSR)**:
   * Cuando se comparta un link en WhatsApp, Facebook, Instagram o Telegram, la plataforma debe renderizar al instante la "tarjeta enriquecida":
     * **Título:** `[Marca] [Modelo] [Año] | AutoLead`
     * **Descripción:** `[Precio] [Moneda] • [Km] km • [Transmisión] • ¡Consultanos!`
     * **Imagen:** URL de la foto de portada del vehículo.

### 1.3. Requerimientos de Seguridad y Privacidad
* **Aislamiento de Datos Sensibles:** El catálogo público **NUNCA** debe recibir ni exponer:
  * Precio de costo / compra del vehículo.
  * Datos del vendedor/dueño anterior (nombre, DNI, teléfono).
  * Gastos de taller o mantenimiento asociados.
  * Márgenes o porcentajes de comisión de consignación.
  * Legajo digital o documentos de titularidad interna.
* **Seguridad de Red y Permisos:** La aplicación pública solo consultará endpoints dedicados sin requerir sesión ni credenciales de usuario.

---

## 2. 🎨 Identidad Visual y Diseño (Alineación con React + Vite)

Para garantizar coherencia con la plataforma interna de AutoLead CRM, el catálogo público adoptará el mismo **Design System** basado en el tema oscuro de alto rendimiento (*Aston Martin Racing Dark*):

### 2.1. Tokens y Paleta de Colores
* **Fondo Principal (`background`):** `#0f1117` (Negro grafito profundo).
* **Superficies / Tarjetas (`surface`):** `#181b24` con bordes sutiles en `#262a36` y `#363c4d`.
* **Acentos Primarios (`primary`):** `#10b981` (Verde esmeralda deportivo) y `#34d399`.
* **Tipografía y Textos:**
  * Fuente principal: **Inter** (`sans-serif`).
  * Texto primario: `#f3f4f6`.
  * Texto secundario / Muted: `#9ca3af`.
  * Precios destacados: `#34d399` en tipografía ultra-bold (`font-black`).

### 2.2. Componentes y Estética de Tarjetas
* Efectos de hover suaves (`transform: translateY(-4px)` con sombras difusas verdes/esmeralda).
* Badges de specs técnicas (Píldoras redondeadas con iconos minimalistas de `lucide-react`).
* Placeholders y Skeleton Loaders elegantes durante la carga de imágenes.

---

## 3. 🏗️ Arquitectura de la Solución y Docker

### 3.1. Esquema de Comunicación

```plaintext
[ Navegador / WhatsApp Bot / Redes Sociales ]
                      │
                      ▼
          [ Nginx Proxy Manager (NPM) ]
         (catalogo.autoleadcrm.tech)
                      │
                      ▼
         [ Contenedor: public-frontend ] (Next.js en puerto 3000)
                      │
                      │ Petición HTTP interna (Docker Network)
                      ▼
         [ Contenedor: backend ] (FastAPI en puerto 8000)
             GET /api/public/catalogo
                      │
                      ▼
         [ Base de Datos: PostgreSQL ]
```

### 3.2. Estructura de Directorios Propuesta (`public-catalog/`)

```plaintext
vendedor-ia-wsp/
├── backend/                    # API FastAPI existente
├── frontend/                   # CRM Privado existente (React + Vite)
├── public-catalog/             # 🚀 NUEVO PROYECTO NEXT.JS PÚBLICO
│   ├── .dockerignore
│   ├── Dockerfile              # Build multi-stage optimizado para producción
│   ├── next.config.mjs         # Configuración de imágenes remotas y standalone output
│   ├── package.json            # Dependencias fijas con pnpm
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── public/                 # Logos, favicon e imágenes estáticas
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Layout raíz (Navbar, Footer, Font Inter, Metadata Base)
│       │   ├── page.tsx        # Catálogo principal (Listado + Filtros)
│       │   ├── vehiculos/
│       │   │   └── [id]/
│       │   │       ├── page.tsx        # Detalle con SSR y generateMetadata()
│       │   │       └── not-found.tsx   # Manejo de vehículos no encontrados o dados de baja
│       │   └── globals.css     # Tokens de diseño Tailwind y variables CSS
│       ├── components/
│       │   ├── catalog/
│       │   │   ├── VehicleCard.tsx       # Tarjeta comercial de vehículo
│       │   │   ├── VehicleGrid.tsx       # Grilla responsiva (1 col móvil, 3 col desktop)
│       │   │   ├── FilterBar.tsx         # Barra de filtros, buscador y orden
│       │   │   └── VehicleSkeleton.tsx   # Loading skeleton
│       │   ├── detail/
│       │   │   ├── ImageGallery.tsx      # Carrusel y visualizador de fotos
│       │   │   ├── SpecGrid.tsx          # Ficha técnica estructurada
│       │   │   └── WhatsAppButton.tsx    # Botón flotante/fijo de WhatsApp con mensaje pre-armado
│       │   └── layout/
│       │       ├── Navbar.tsx            # Cabecera con logo de la concesionaria y contacto
│       │       └── Footer.tsx            # Pie de página institucional y redes
│       ├── services/
│       │   └── api.ts                    # Cliente fetch hacia FastAPI con caché/revalidación
│       └── types/
│           └── vehicle.ts                # Interfaces TypeScript de datos públicos
```

---

## 4. ⚙️ Plan Paso a Paso de Desarrollo e Implementación

### Fase 1: Habilitar Endpoints Públicos en Backend (FastAPI)
1. **Crear Router Público (`backend/app/Modules/vehiculos/public_router.py`)**:
   * Endpoint `GET /api/public/catalogo`:
     * Soporta filtros (`search`, `precio_min`, `precio_max`, `anio_min`, `anio_max`, `transmision`, `combustible`, `carroceria`, `sort_by`, `page`, `size`).
     * Filtra estrictamente por `estado == "disponible"`.
     * Retorna únicamente campos seguros (DTO `PublicVehiculoResponse`).
   * Endpoint `GET /api/public/catalogo/{id}`:
     * Retorna el detalle completo del vehículo si está disponible. Si no existe o fue vendido, devuelve un error 404.
2. **Registrar Router en `backend/main.py`**:
   * Incluir `app.include_router(public_vehiculos_router, prefix="/api")` sin dependencias de autenticación.

---

### Fase 2: Inicialización del Proyecto Next.js
1. **Estructurar `package.json`**:
   * Versiones fijas (sin `^` ni `~`) de acuerdo a las reglas de seguridad del workspace:
     * `next`: `15.x` o `14.x`
     * `react`: `19.x` o `18.x`
     * `lucide-react`
     * `tailwindcss`
     * `clsx`, `tailwind-merge`
   * Configuración de `pnpm.onlyBuiltDependencies` si se requiere compilación de binarios.
2. **Configuración de `next.config.mjs`**:
   * Habilitar `output: "standalone"` para generar un contenedor Docker liviano.
   * Configurar `images.remotePatterns` para permitir cargar imágenes servidas desde el dominio o IP del backend FastAPI (`/fotos/**`).

---

### Fase 3: Configuración de Estilos y Layout Base
1. **Estilos Globales (`src/app/globals.css`)**:
   * Replicar las variables de color del tema *Aston Martin Racing Dark*.
2. **Layout Principal (`src/app/layout.tsx`)**:
   * Incorporar la fuente `Inter`.
   * Montar `Navbar` con logotipo y número de atención.
   * Montar `Footer` con datos de ubicación, horarios de atención y redes sociales.

---

### Fase 4: Desarrollo de Componentes del Catálogo
1. **`VehicleCard.tsx`**:
   * Imagen de portada con ratio 16:9 y soporte para fotos en caché.
   * Título destacado (`Marca Modelo Versión`).
   * Píldoras de especificaciones: Año, Kilometraje, Transmisión, Combustible.
   * Precio en tamaño grande y moneda (USD / ARS).
   * Botón *"Ver Más"* con navegación instantánea.
2. **`FilterBar.tsx`**:
   * Input de búsqueda rápida con debounce.
   * Selectores desplegables o chips de filtrado para Tipo de Vehículo, Rango de Precio y Transmisión.
   * Contador de vehículos disponibles encontrados.

---

### Fase 5: Detalle del Vehículo y Meta-Etiquetas SSR (OpenGraph)
1. **Generación de Metadata Dinámica (`generateMetadata`)**:
   ```typescript
   export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
     const vehiculo = await getPublicVehiculoById(params.id);
     if (!vehiculo) return { title: "Vehículo no encontrado | AutoLead" };

     const titulo = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} | AutoLead`;
     const descripcion = `${vehiculo.moneda_venta} $${vehiculo.precio_venta.toLocaleString()} • ${vehiculo.kilometraje.toLocaleString()} km • ${vehiculo.transmision}`;
     const imagenPrincipal = vehiculo.imagenes[0]?.ruta_completa || "/placeholder-car.jpg";

     return {
       title: titulo,
       description: descripcion,
       openGraph: {
         title: titulo,
         description: descripcion,
         images: [{ url: imagenPrincipal }],
         type: "article",
       },
       twitter: {
         card: "summary_large_image",
         title: titulo,
         description: descripcion,
         images: [imagenPrincipal],
       },
     };
   }
   ```
2. **Componente de Galería (`ImageGallery.tsx`)**:
   * Visualizador de fotos en alta resolución con selector de miniaturas.
3. **Botón de Contacto WhatsApp (`WhatsAppButton.tsx`)**:
   * Generación dinámica de la URL:
     `https://wa.me/549XXXXXXXXXX?text=Hola!%20Estoy%20interesado%20en%20el%20vehículo%20${vehiculo.marca}%20${vehiculo.modelo}%20(ID:%20${vehiculo.id})`

---

### Fase 6: Dockerización e Integración de Infraestructura
1. **Crear `public-catalog/Dockerfile`**:
   * Construcción multi-stage (builder -> runner standalone) reduciendo el tamaño de la imagen final a <150MB.
2. **Actualizar `docker-compose.yml`**:
   ```yaml
   public-frontend:
     build: ./public-catalog
     container_name: public-catalog-vendedor-ia
     restart: unless-stopped
     depends_on:
       - backend
     environment:
       - BACKEND_INTERNAL_URL=http://backend:8000
       - NEXT_PUBLIC_API_URL=https://lvm.autoleadcrm.tech
     logging:
       driver: "json-file"
       options:
         max-size: "10m"
         max-file: "3"
   ```
3. **Actualizar `docker-compose.override.yml` (Entorno Local)**:
   * Exponer el catálogo en el puerto `3001:3000` para pruebas locales sin interferir con el puerto `3000` del CRM.
4. **Configuración en Nginx Proxy Manager (Producción)**:
   * Dominio: `catalogo.autoleadcrm.tech` (o el dominio principal que se elija).
   * Forward Hostname / IP: `public-frontend`.
   * Forward Port: `3000`.
   * Habilitar SSL (Let's Encrypt) y HTTP/2.

---

## 5. 🛡️ Consideraciones de Seguridad y Buenas Prácticas

1. **Gestor de Paquetes (PNPM)**:
   * Mantener versiones exactas de dependencias fijadas en `package.json`.
   * Respetar la directiva global `ignore-scripts=true`.
2. **Caché y Revalidación (ISR / Incremental Static Regeneration)**:
   * Configurar un `revalidate` (por ejemplo, 60 segundos) en las llamadas a la API de vehículos para que el servidor Next.js no sobrecargue a FastAPI en picos de tráfico, sirviendo contenido instantáneo y fresco.
3. **Sanitización de Datos**:
   * Escapar cualquier parámetro de entrada en la búsqueda para prevenir inyecciones.
4. **Control de Versiones**:
   * Recordar que el asistente no ejecuta comandos `git add`, `git commit` ni `git push`, limitándose a sugerir los mensajes de commit estructurados.

---

## 6. 📋 Resumen de Comandos a Ejecutar por el Usuario (Cuando se Inicie la Fase)

> [!NOTE]
> Estos comandos son una referencia informativa para cuando decidas iniciar el desarrollo práctico.

* **Inicialización de carpeta y estructura:**
  ```bash
  mkdir public-catalog
  ```
* **Instalación de dependencias (vía pnpm):**
  ```bash
  cd public-catalog
  pnpm install
  ```
* **Prueba en desarrollo local:**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --build public-frontend
  ```
* **Acceso de prueba:**
  * CRM Administrativo: `http://localhost:3000`
  * Catálogo Público: `http://localhost:3001`
  * Backend API: `http://localhost:8000`
