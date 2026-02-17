# Hybridge Blog API

API REST desarrollada con Node.js, Express y PostgreSQL como parte de la materia **Desarrollo Web (Backend)** del programa Hybridge Education.

---

## Descripción

Backend de un sistema de blog que expone endpoints para gestionar publicaciones y sus autores. Construido sobre el stack **MERN/MEAN** utilizando JavaScript tanto en el servidor como en la lógica de datos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js v24 |
| Framework | Express.js |
| ORM | Sequelize v6 |
| Base de datos | PostgreSQL (Supabase) |
| Variables de entorno | dotenv |

---

## Estructura del proyecto

```
hybridge-blog-api/
├── config/
│   └── config.json         # Configuración de conexión a la BD
├── migrations/
│   ├── ...-create-author.js
│   └── ...-create-post.js
├── models/
│   ├── index.js            # Inicialización de Sequelize
│   ├── author.js           # Modelo Author
│   └── post.js             # Modelo Post
├── seeders/                # Datos iniciales (pendiente)
├── .env                    # Variables de entorno (no incluido en Git)
├── .gitignore
├── .sequelizerc            # Configuración del CLI de Sequelize
├── index.js                # Servidor principal Express
├── hola.js                 # Primer ejercicio - Hello World en Node.js
└── package.json
```

---

## Esquema de la base de datos

### Tabla `Authors`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER (PK) | Identificador único, autoincremental |
| name | STRING | Nombre del autor |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Última actualización |
| deletedAt | TIMESTAMP | Soft delete (null = activo) |

### Tabla `Posts`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER (PK) | Identificador único, autoincremental |
| title | STRING | Título de la publicación |
| content | TEXT | Contenido completo |
| authorId | INTEGER (FK) | Referencia a `Authors.id` |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Última actualización |
| deletedAt | TIMESTAMP | Soft delete (null = activo) |

**Relación:** Un `Author` tiene muchos `Posts` (1:N)

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/BENMP0902/hybridge-blog-api.git
cd hybridge-blog-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database
```

> Puedes obtener este string desde tu proyecto en [Supabase](https://supabase.com) → Connect → Transaction pooler.
>
> ⚠️ Si tu contraseña contiene caracteres especiales (como `%`), debes codificarlos como URL encoding: `%` → `%25`.

### 4. Ejecutar migraciones

```bash
npx sequelize-cli db:migrate
```

### 5. Iniciar el servidor

```bash
npm start
```

El servidor corre en `http://localhost:3000`

---

## Endpoints disponibles

### `GET /`

Información general de la API.

**Respuesta:**
```json
{
  "message": "API de Hybridge Blog",
  "endpoints": {
    "posts": "/api/posts"
  }
}
```

---

### `GET /api/posts`

Retorna todas las publicaciones activas con su autor.

**Respuesta:**
```json
[
  {
    "id": 1,
    "title": "Mi primer post",
    "content": "Contenido del post",
    "authorId": 1,
    "createdAt": "2026-02-17T00:00:00.000Z",
    "updatedAt": "2026-02-17T00:00:00.000Z",
    "deletedAt": null,
    "author": {
      "id": 1,
      "name": "Juan Pérez",
      "createdAt": "2026-02-17T00:00:00.000Z",
      "updatedAt": "2026-02-17T00:00:00.000Z",
      "deletedAt": null
    }
  }
]
```

---

## Temas cubiertos en el curso

- [x] Introducción al desarrollo Backend
- [x] Fundamentos de Node.js y stacks de tecnología
- [x] HTTP, Express y creación de APIs REST
- [x] Bases de datos relacionales y ORMs (Sequelize + PostgreSQL)
- [ ] Autenticación y autorización
- [ ] Despliegue en producción

---

## Notas de desarrollo

Para el historial de problemas encontrados y decisiones técnicas tomadas durante el desarrollo, consulta [`LEARNING.md`](./LEARNING.md).

---

## Autor

**Benjamin** — Estudiante de Ingeniería en Software  
Programa: Hybridge Education · Materia: Desarrollo Web (Backend)
