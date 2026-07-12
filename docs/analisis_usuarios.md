# Análisis del Sistema de Usuarios (Autenticación y Autorización)

Este documento detalla el análisis del sistema de usuarios del repositorio `Parcial1-Prog-4`, abarcando desde la encriptación y validación en el backend (FastAPI) hasta la restricción de URLs y manejo del estado de sesión en el frontend (React + Zustand + React Router).

---

## 🔑 1. Backend: Autenticación y Criptografía

El backend está desarrollado sobre **FastAPI** y sigue patrones arquitectónicos como *Unit of Work* (UoW) y separación de responsabilidades por módulos.

### A. Encriptación de Contraseñas
La seguridad de las contraseñas se gestiona en [jwt.py](file:///home/cristian/repos_utn/Parcial1-Prog-4/backend/app/Core/Security/jwt.py):
*   **Algoritmo**: Utiliza la biblioteca `passlib` con el esquema **bcrypt** para generar hashes seguros.
*   **Funciones principales**:
    *   `get_password_hash(password: str) -> str`: Convierte contraseñas en texto plano a un hash seguro de bcrypt para guardarse en la columna `password_hash` de la tabla `Usuario`.
    *   `verify_password(plain_password: str, hashed_password: str) -> bool`: Compara contraseñas enviadas en el login con el hash almacenado utilizando funciones seguras contra ataques de sincronización.

### B. Generación y Firma de Tokens (JWT)
El backend utiliza la biblioteca `python-jose` para codificar y firmar JSON Web Tokens:
*   El token de acceso (`access_token`) codifica la identidad del usuario (`sub` con el email) y su rol (`rol`).
*   Los tokens expiran dinámicamente basándose en la configuración `ACCESS_TOKEN_EXPIRE_MINUTES` y se firman criptográficamente con la clave secreta `SECRET_KEY` configurada en el servidor.

### C. Estrategia de Autenticación mediante Cookies HttpOnly
El backend implementa un esquema de seguridad robusto contra ataques **XSS (Cross-Site Scripting)**:
*   En [deps.py](file:///home/cristian/repos_utn/Parcial1-Prog-4/backend/app/Core/Security/deps.py), se define la clase personalizada `OAuth2PasswordBearerWithCookie`:
    ```python
    class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
        async def __call__(self, request: Request) -> str | None:
            token = request.cookies.get("access_token")
            # El soporte para el header Authorization fue deshabilitado explícitamente 
            # para forzar cookies HttpOnly y evitar que JS manipule el token.
            if not token:
                if self.auto_error:
                    raise HTTPException(...)
            return token
    ```
*   Al iniciar sesión en `/login` ([authRouter.py](file:///home/cristian/repos_utn/Parcial1-Prog-4/backend/app/Modules/Auth/authRouter.py)), el backend establece el token de acceso directamente en una cookie segura:
    ```python
    response.set_cookie(key="access_token", value=token_data.access_token, httponly=True, samesite="lax", secure=True)
    ```
    *   `httponly=True`: Evita que scripts del frontend (JavaScript) lean la cookie, bloqueando el robo de tokens vía XSS.
    *   `samesite="lax"` y `secure=True`: Mitigan ataques CSRF y garantizan el envío exclusivo a través de HTTPS.

### D. Renovación de Sesión (Refresh Tokens)
El sistema implementa rotación de tokens para mantener sesiones activas sin comprometer la seguridad:
*   Al hacer login, se genera un refresh token aleatorio de alta entropía (`secrets.token_hex(32)`) que se guarda en la base de datos vinculada al usuario (`RefreshToken`).
*   En el endpoint `/refresh` ([authService.py](file:///home/cristian/repos_utn/Parcial1-Prog-4/backend/app/Modules/Auth/authService.py)), cuando un cliente solicita renovar su sesión, se invalida el refresh token anterior (`is_revoked = True`) y se genera un par nuevo (tanto access token como refresh token). Esto evita ataques de reutilización.

### E. Registro de Auditoría (Audit Logs)
Todas las acciones críticas del flujo de autenticación escriben eventos históricos en la base de datos:
*   Acciones como `USUARIO_REGISTRO`, `LOGIN_EXITOSO`, `LOGIN_FALLIDO`, `LOGOUT` y `TOKEN_REFRESH` se guardan en la tabla `Auditoria` asociadas al ID del usuario y metadatos relevantes.

---

## 🛡️ 2. Backend: Autorización y Roles (RBAC)

El sistema soporta Control de Acceso Basado en Roles (RBAC) para denegar o permitir el acceso a endpoints específicos.

### A. Roles Definidos
Los roles están definidos mediante un Enum en [usuario.py](file:///home/cristian/repos_utn/Parcial1-Prog-4/backend/app/Modules/Usuarios/usuario.py):
1.  `ADMIN`: Acceso total al sistema, gestión de usuarios, reportes y configuraciones.
2.  `STOCK`: Encargado de la gestión de productos, ingredientes y categorías.
3.  `PEDIDOS`: Gestor de compras y control de estados de pedidos.
4.  `CLIENT`: Rol por defecto de registro público. Acceso únicamente al store y sus propios pedidos.

### B. Validación de Permisos en Endpoints
En [deps.py](file:///home/cristian/repos_utn/Parcial1-Prog-4/backend/app/Core/Security/deps.py), se define la función `require_role(allowed_roles: list[UserRole])` que genera una dependencia reutilizable:
```python
def require_role(allowed_roles: list[UserRole]):
    async def role_checker(
        current_user: Annotated[Usuario, Depends(get_current_active_user)],
    ) -> Usuario:
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Se requiere uno de: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker
```

**Ejemplo de uso en un Router ([usuarioRouter.py](file:///home/cristian/repos_utn/Parcial1-Prog-4/backend/app/Modules/Usuarios/usuarioRouter.py)):**
```python
@router.get("/", dependencies=[Depends(require_role([UserRole.ADMIN]))])
def listar_usuarios(...):
    # Solo los usuarios con rol ADMIN pueden consumir este endpoint
```

---

## 🌐 3. Frontend: Gestión de Sesión y Restricción de URLs

El frontend está construido sobre **React**, usando **Zustand** para la gestión del estado global y **React Router v6** para la navegación y guardado de rutas.

### A. Persistencia del Estado de Autenticación
La sesión del usuario se gestiona en [authStore.ts](file:///home/cristian/repos_utn/Parcial1-Prog-4/frontend/src/store/authStore.ts) mediante Zustand:
*   Utiliza el middleware `persist` para sincronizar el estado del cliente con el almacenamiento local (`localStorage` bajo la clave `'foodstore-auth'`).
*   Guarda información sobre:
    *   `accessToken` y `refreshToken`
    *   `usuario` (objeto con datos del perfil y roles)
    *   `isAuthenticated` (booleano)
*   Métodos como `login` y `logout` llaman directamente a la capa de servicios (`authApi`) para sincronizarse con el backend, limpiando o llenando el store.

### B. Comunicación Segura con Axios
La comunicación con la API se realiza en [axiosClient.ts](file:///home/cristian/repos_utn/Parcial1-Prog-4/frontend/src/api/axiosClient.ts):
*   Se configura `withCredentials: true` en la instancia de Axios. Esto le indica al navegador que **debe enviar automáticamente la cookie HttpOnly `access_token`** en cada petición al backend.
*   **Interceptor de Respuestas**: intercepta las respuestas HTTP. Si detecta un código `401 Unauthorized` (y no proviene de las rutas públicas de login/registro), borra la sesión y redirige inmediatamente al usuario a la vista de login (`window.location.href = '/login'`).

### C. Restricción de URLs y Vistas (Guardias de Rutas)
En [AppRoutes.tsx](file:///home/cristian/repos_utn/Parcial1-Prog-4/frontend/src/routes/AppRoutes.tsx), se utiliza el componente `<ProtectedRoute />` para impedir accesos no autorizados a páginas completas o subcomponentes.

#### El componente [ProtectedRoute.tsx](file:///home/cristian/repos_utn/Parcial1-Prog-4/frontend/src/features/auth/ProtectedRoute.tsx):
```tsx
export function ProtectedRoute({ requiredRoles = [], redirectTo = '/login', children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRoles.length > 0 && !requiredRoles.some((r) => hasRole(r))) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
```

#### Estructura de Rutas y Roles en [AppRoutes.tsx](file:///home/cristian/repos_utn/Parcial1-Prog-4/frontend/src/routes/AppRoutes.tsx):
*   **Rutas Públicas**: Acceso sin login a `/`, `/menu`, `/login`, `/register`.
*   **Rutas de Cliente**: Envueltas en un `<ProtectedRoute />` general sin restricción de roles (cualquier usuario logueado accede). Ruta raíz: `/store`.
*   **Rutas de Administración**: Envueltas jerárquicamente según roles específicos.
    *   Ruta general de administración `/admin` protegida para roles `['ADMIN', 'STOCK', 'PEDIDOS']`.
    *   Subrutas restrictivas adicionales usando `<ProtectedRoute />` inline:
        *   `/admin/dashboard`: Requiere rol `['ADMIN']`. Si no, redirige a `/admin/productos`.
        *   `/admin/productos`: Requiere rol `['ADMIN', 'STOCK']`. Si no, redirige a `/admin/pedidos`.
        *   `/admin/pedidos`: Requiere rol `['ADMIN', 'PEDIDOS']`. Si no, redirige a `/admin/productos`.
        *   `/admin/usuarios`: Requiere rol `['ADMIN']`.
*   **Redirección de Fallback**: Si un usuario intenta acceder a una ruta inexistente o no autorizada, el sistema redirige a `/unauthorized` mostrando un error HTTP 403 o directamente lo devuelve al Home `/`.

---

## 🔍 4. Observaciones y Sugerencias de Mejora

A continuación se listan aspectos a tener en cuenta para robustecer aún más la seguridad del sistema:

1.  **Protección frente a CSRF (Cross-Site Request Forgery)**:
    *   Dado que el backend ahora confía de manera exclusiva en la cookie `access_token`, es vulnerable a ataques CSRF si una página externa induce al usuario a hacer peticiones. Aunque `samesite="lax"` ofrece protección por defecto en navegadores modernos, se aconseja implementar protección de tokens CSRF (por ejemplo, validación de un header personalizado generado por el frontend).
2.  **Sincronización del Logout**:
    *   El método `logout` en el frontend borra el localStorage localmente e intenta notificar al backend en segundo plano. Si la petición de red del backend falla (por pérdida de internet momentánea, por ejemplo), el token en el backend no se revoca inmediatamente. Es aconsejable que la limpieza local ocurra *después* o se asiente un flujo de recuperación offline de deslogueo.
3.  **Renovación Automática de Token (Interceptor Axios)**:
    *   Actualmente, el frontend posee un flujo para refrescar sesión, pero no parece haber un interceptor en el cliente de Axios que intercepte un token expirado (401), intente renovar llamando a `/refresh` de manera transparente y re-intente la petición fallida antes de forzar la redirección a `/login`. Esto mejoraría significativamente la experiencia del usuario.
4.  **Verificación de Cuenta y Recuperación de Contraseña**:
    *   Actualmente, al registrarse, la cuenta es inmediatamente activa y no hay endpoints para recuperación de contraseña (Password Reset) en caso de olvido.
