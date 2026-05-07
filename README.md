<div align="center">

# TallerApp — Backend

**API REST para sistema de gestión de taller de reparación de celulares**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.x-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)](LICENSE)

> Proyecto académico — Gestión y Configuración del Software · Universidad de Guayaquil

</div>

---

## Descripción

API REST construida con Node.js y Express que gestiona toda la lógica de negocio del taller de Juan: reparaciones, inventario, facturación, notificaciones por correo y reportes. Usa PostgreSQL como base de datos y Sequelize como ORM.

---

## Endpoints de la API

### Autenticación — `/api/auth`

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/register` | Registrar nuevo usuario | Público |
| POST | `/login` | Iniciar sesión (devuelve JWT) | Público |
| POST | `/recuperar-password` | Enviar correo de recuperación | Público |

### Reparaciones — `/api/reparaciones`

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar todas las reparaciones | Admin, Técnico |
| GET | `/:id` | Obtener reparación por ID | Admin, Técnico |
| POST | `/` | Crear nueva reparación | Admin, Técnico |
| PUT | `/:id/estado` | Actualizar estado | Admin, Técnico |
| GET | `/seguimiento/:codigo` | Consulta pública por código | Público |
| GET | `/cliente/:id` | Historial del cliente | Cliente |

### Inventario — `/api/repuestos`

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar repuestos | Admin, Técnico |
| GET | `/:id` | Obtener repuesto | Admin, Técnico |
| POST | `/` | Agregar repuesto | Admin |
| PUT | `/:id` | Editar repuesto | Admin |
| DELETE | `/:id` | Eliminar repuesto | Admin |
| GET | `/alertas/stock-minimo` | Repuestos bajo stock mínimo | Admin, Técnico |

### Facturación — `/api/facturas`

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar facturas | Admin |
| GET | `/:id` | Obtener factura | Admin, Cliente |
| POST | `/` | Generar factura | Admin |
| GET | `/:id/pdf` | Descargar factura en PDF | Admin, Cliente |

### Reportes — `/api/reportes`

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/reparaciones` | Reparaciones por período | Admin |
| GET | `/ingresos` | Ingresos por período | Admin |
| GET | `/inventario` | Estado actual del inventario | Admin |

---

## Base de Datos

```
+----------+       +------------+       +-----------+
| usuario  |------>|  cliente   |------>|reparacion |
|          |       |            |       |           |
| id       |       | id         |       | id        |
| nombre   |       | usuario_id |       | cliente_id|
| email    |       | telefono   |       |dispositivo|
| password |       | direccion  |       | problema  |
| rol      |       +------------+       | estado    |
+----------+                            | costo     |
                                        +-----+-----+
                                              |
                   +--------------+           |
                   |   factura    |<----------+
                   |              |           |
                   | id           |      +----+------------------+
                   | reparacion_id|      | reparacion_repuesto   |
                   | total        |      |                       |
                   | estado_pago  |      | reparacion_id         |
                   +--------------+      | repuesto_id           |
                                         | cantidad              |
                   +----------+          +----+------------------+
                   | repuesto |<--------------+
                   |          |
                   | id       |
                   | nombre   |
                   | stock    |
                   | precio   |
                   +----------+
```

---

## Arquitectura de Carpetas

```
Backend/
├── src/
│   ├── config/
│   │   └── database.js             # Conexión Sequelize + PostgreSQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── reparacionController.js
│   │   ├── repuestoController.js
│   │   ├── facturaController.js
│   │   └── reporteController.js
│   ├── middlewares/
│   │   ├── verificarToken.js
│   │   └── verificarRol.js
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Cliente.js
│   │   ├── Reparacion.js
│   │   ├── Repuesto.js
│   │   ├── ReparacionRepuesto.js
│   │   └── Factura.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── reparacion.routes.js
│   │   ├── repuesto.routes.js
│   │   ├── factura.routes.js
│   │   └── reporte.routes.js
│   └── services/
│       ├── emailService.js         # Nodemailer
│       └── pdfService.js           # pdfkit
├── .env
├── .env.example
├── .gitignore
├── index.js
└── package.json
```

---

## Instalación y Uso

### Prerrequisitos

- Node.js 20.x o superior
- PostgreSQL 16.x corriendo localmente
- npm 10.x o superior

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/tallerapp-backend.git
cd tallerapp-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar el servidor
npm run dev
```

La API estará disponible en `http://localhost:3000`

### Variables de Entorno

```env
# Servidor
PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tallerapp
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=clave_super_secreta

# Correo (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=tu_contraseña_de_app
```

---

## Flujo de Ramas

```
main          <- Solo version estable y lista para produccion
 └── develop  <- Integracion de todas las features
      ├── feature/auth
      ├── feature/reparaciones
      ├── feature/inventario
      ├── feature/facturacion
      ├── feature/notificaciones
      └── feature/reportes
```

### Convención de Commits

```
feat:     Nuevo endpoint o funcionalidad
fix:      Corrección de bug
chore:    Configuración, dependencias
refactor: Reestructura sin cambio de comportamiento
docs:     Cambios en documentación
```

---

## Repositorio Frontend

Este backend es consumido por:
[TallerApp — Frontend](https://github.com/tu-usuario/tallerapp-frontend)

---

## Equipo

Desarrollado por estudiantes de la **Universidad de Guayaquil**
Asignatura: Gestión y Configuración del Software
