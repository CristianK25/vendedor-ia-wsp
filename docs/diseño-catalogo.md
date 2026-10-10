# Diseño del Catálogo Público - LVM Automotores

## 1. Identidad y Concepto General
* **El Problema Actual:** El catálogo actual se ve muy "sistema interno/CRM" oscuro, frío, y las tarjetas se pierden. Parece un panel de administración en lugar de una vidriera comercial.
* **El Objetivo:** Lograr un catálogo directo y funcional. Como hay un máximo de 20-25 autos, cada vehículo es una pieza clave.
* **Estética Elegida: Dark Minimalism (Minimalismo Oscuro)**
  - Fondo negro liso puro (`bg-black`).
  - Paleta Monocromática: Todo en Blanco y Negro (Black & White). El único color permitido en toda la página es el verde neón del logo de LVM.
  - Formas: Botones con bordes totalmente redondeados tipo pastilla (`rounded-full`) para dar suavidad y un toque premium moderno. Tarjetas con bordes suaves (`rounded-2xl`).
  - El botón de contacto ya no es verde gigante, sino un elegante botón blanco con texto negro, que resalta muchísimo más sobre el fondo oscuro sin romper la armonía.

## 2. Componentes de la Página

### A. La Cabecera (Navbar)
* **Actual:** Barra superior básica con el nombre y un botón de WhatsApp.
* **Propuesta:** 
  - Cabecera minimalista y funcional.
  - Fondo negro, logo de LVM Automotores a la izquierda o centrado.
  - Navegación básica y directa (botones simples sin efectos excesivos).

### B. Sección Hero (Bienvenida)
* **Actual:** Simplemente un título "Vehículos Disponibles".
* **Propuesta:**
  - Agregar un pequeño banner o sección de bienvenida (Hero) antes de los autos.
  - Título principal elegante: *"Encontrá tu próximo vehículo"* o *"Selección Exclusiva"*.
  - Un subtítulo que refuerce la marca: *"Calidad y confianza en cada unidad. LVM Automotores."*

### C. Navegación / Filtros Rápidos (Opcional pero recomendado)
* **Actual:** No hay filtros.
* **Propuesta:** Aunque son solo 25 autos, una barra de "píldoras" (chips) horizontales justo arriba de la grilla queda muy bien. Ejemplos: `[Todos]`, `[Autos]`, `[Camionetas/SUVs]`, `[Automáticos]`. Es muy amigable para celular.

### D. La Grilla de Vehículos (Layout)
* **El Reto de las Fotos:** Como las fotos que se suben tienden a ser cuadradas (1:1) o verticales (e.g., collages lado a lado), las tarjetas muy anchas recortarían la foto de manera extraña o dejarían mucho espacio vacío.
* **Propuesta:** 
  - Usar una **Grilla de Tarjetas Verticales (Portrait Cards)**. 
  - En desktop: 3 o 4 columnas. Como las tarjetas serán más altas que anchas, acomodar 4 columnas funciona perfecto sin comprimir la información.
  - En móviles: 1 sola columna. Las fotos se verán gigantes y muy atractivas.

### E. Diseño de la Tarjeta (Card)
* **Actual:** Estilo "admin", texto amontonado, la foto no destaca lo suficiente.
* **Propuesta Adaptada (Black & Green):**
  - **Contenedor de Imagen:** La foto debe tener un contenedor con proporción fija (ej. 1:1 Cuadrado o 4:5 Vertical). Se usa la propiedad `object-cover` para que la foto llene el espacio sin deformarse, asegurando que todas las tarjetas tengan exactamente la misma altura y se vea ordenado.
  - **Paleta de Colores:** Fondo de página blanco/gris muy claro. Textos en color negro intenso (haciendo juego con tu logo negro) y todos los detalles interactivos o llamadas a la acción (CTA) en el color verde de tu logo.
  - **Tipografía:** 
    - **Marca y Modelo:** Letra grande, negra y limpia.
    - **Detalles (KM, Transmisión):** Texto gris sutil, en dos o tres columnas pequeñas dentro de la tarjeta.
  - **Precio:** Muy destacado, alineado a la izquierda.
  - **Llamado a la Acción (CTA):** Un botón verde a la derecha o cubriendo el ancho inferior que diga "WhatsApp" con el ícono, aprovechando el verde de la marca.

## 3. Experiencia de Usuario (Micro-interacciones)
* Animaciones suaves al scrollear (que las tarjetas aparezcan de abajo hacia arriba).
* Hover en la tarjeta: La foto vertical hace un sutil zoom in, y el contenedor proyecta una sombra más pronunciada.
* Feedback visual inmediato al hacer clic en el botón de WhatsApp.
