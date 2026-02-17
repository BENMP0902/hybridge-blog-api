# LEARNING.md — Bitácora de Desarrollo

Registro personal de errores encontrados, decisiones técnicas y aprendizajes durante el desarrollo de **Hybridge Blog API**.

> Este archivo es un diario técnico honesto, no documentación pulida. Su propósito es dejar registro de cómo se resolvieron problemas reales.

---

## Sesión 1 — Configuración inicial y primeras migraciones

### Error 1: URL encoding en la contraseña de Supabase

**Contexto:** Al ejecutar `npx sequelize-cli db:migrate` por primera vez.

**Error:**
```
ERROR: Error parsing url: postgresql://postgres.xxx:maBVkYZZ%g-S4cY@aws-...
```

**Causa:**  
La contraseña generada por Supabase contenía el carácter `%`, que tiene significado especial en URLs (se usa para percent-encoding). Sequelize no podía parsear la connection string correctamente.

**Solución:**  
URL-encodear el carácter especial dentro de la contraseña en el archivo `.env`:

```
# Antes (roto)
DATABASE_URL=...VkYZZ%g-S4cY@...

# Después (correcto)
DATABASE_URL=...VkYZZ%25g-S4cY@...
```

**Regla aprendida:**  
En connection strings, los caracteres especiales en la contraseña deben codificarse:
`%` → `%25`, `@` → `%40`, `:` → `%3A`

---

### Error 2: Typo en nombre de columna al generar modelo

**Contexto:** Al ejecutar el comando `model:generate` para el modelo `Post`.

**Comando ejecutado (incorrecto):**
```bash
npx sequelize-cli model:generate --name Post --attributes title:string,content:text,authorId:integer,deleteAt:date
```

**Problema:** Se escribió `deleteAt` en lugar de `deletedAt`. El archivo de migración y el modelo quedaron con el nombre incorrecto.

**Solución:**  
En lugar de eliminar y regenerar los archivos, se editaron manualmente:
- `models/post.js` → cambiar `deleteAt` por `deletedAt`
- `migrations/...-create-post.js` → mismo cambio

**Cuándo editar manualmente vs regenerar:**  
- ✅ Editar manualmente: typos simples antes de ejecutar `db:migrate`
- ✅ Regenerar: cambios estructurales o cuando ya corriste la migración

---

## Sesión 2 — Conexión del backend a la base de datos

### Error 3: Código pegado en el archivo equivocado

**Contexto:** Al intentar agregar la ruta `/api/posts` conectada a la BD.

**Problema:**  
El código del servidor (rutas Express) se pegó en `models/index.js` en lugar de `index.js`.

```
models/index.js  → Configuración de Sequelize (NO va código de rutas aquí)
index.js         → Servidor Express (aquí van las rutas)
```

**Consecuencia:**  
```
Error: Cannot find module 'C:\...\index.js'
```
El servidor no arrancaba porque `index.js` no existía como archivo principal.

**Solución:**  
Revertir `models/index.js` a su estado original y mover el código al `index.js` correcto.

**Aprendizaje:**  
Cada archivo tiene una responsabilidad única (Single Responsibility Principle):
- `models/index.js` = inicializar Sequelize y cargar modelos
- `index.js` = configurar Express y definir rutas

---

### Error 4: Ruta absoluta vs ruta relativa en `require()`

**Error:**
```
Error: Cannot find module '/models'
```

**Causa:**  
```javascript
// ❌ Ruta absoluta (busca en C:\models — no existe)
const { Post, Author } = require('/models');

// ✅ Ruta relativa (busca en ./models — existe)
const { Post, Author } = require('./models');
```

**Regla:**
| Sintaxis | Significado |
|----------|-------------|
| `require('./algo')` | Carpeta/archivo relativo al archivo actual |
| `require('/algo')` | Ruta absoluta desde raíz del sistema |
| `require('algo')` | Módulo en `node_modules/` |

---

### Error 5: Variable `db` no definida

**Error:**
```
ReferenceError: db is not defined
    at index.js:20:17
```

**Causa:**  
Se importó `{ Post, Author }` pero en la ruta se usó `db.Post.findAll()`:

```javascript
// Import hecho
const { Post, Author } = require('./models');

// Uso incorrecto (db no fue importado)
const posts = await Post.findAll(); // ❌
```

**Solución:**  
Consistencia entre import y uso:

```javascript
// Opción A: Usar los modelos directamente
const { Post, Author } = require('./models');
const posts = await Post.findAll(); // ✅

// Opción B: Importar db completo
const db = require('./models');
const posts = await db.Post.findAll(); // ✅
```

Se eligió la **Opción A** por ser más explícita y limpia.

---

### Error 6: EagerLoadingError — asociación sin definir

**Error:**
```
EagerLoadingError: Author is not associated to Post!
```

**Causa:**  
El método `associate()` en los modelos estaba vacío. Sequelize no sabía que existía una relación entre `Post` y `Author`.

**Solución:**  
Definir las asociaciones en ambos modelos:

```javascript
// models/author.js
static associate(models) {
  Author.hasMany(models.Post, {
    foreignKey: 'authorId',
    as: 'posts'
  });
}

// models/post.js
static associate(models) {
  Post.belongsTo(models.Author, {
    foreignKey: 'authorId',
    as: 'author'
  });
}
```

---

### Error 7: EagerLoadingError — alias no especificado en include

**Error:**
```
EagerLoadingError: Author is associated to Post using an alias.
You must use the 'as' keyword to specify the alias within your include statement.
```

**Causa:**  
La asociación se definió con `as: 'author'` pero el `include` no usaba el alias:

```javascript
// ❌ Sin alias (Sequelize exige el alias cuando fue definido)
include: [Author]

// ✅ Con alias correcto
include: [{ model: Author, as: 'author' }]
```

**Regla aprendida:**  
> Si defines `as` en una asociación, **siempre** debes usar el mismo `as` en los `include`.

**Este error fue resuelto con Claude Code** directamente en la terminal, sin necesidad de copiar código al chat. Claude Code leyó los archivos, identificó la inconsistencia y aplicó el fix con un diff claro.

---

## Herramientas utilizadas para debugging

### Claude Code (terminal)

A partir de la sesión 2, se integró **Claude Code** para resolver errores directamente desde la terminal del proyecto.

**Ventajas vs chat:**
- Lee los archivos del proyecto sin que se los pegues
- Aplica cambios directamente con diffs visibles
- No requiere copiar/pegar errores manualmente

**Prompt efectivo usado:**
```
Tengo un EagerLoadingError en GET /api/posts.
El error dice: [texto del error].
Revisa models/post.js, models/author.js e index.js y corrígelo.
```

---

## Decisiones técnicas tomadas

| Decisión | Alternativa descartada | Razón |
|----------|------------------------|-------|
| Soft delete con `deletedAt` | Hard delete (DELETE físico) | Preservar datos históricos y evitar romper foreign keys |
| Importar `{ Post, Author }` directamente | Importar `db` completo | Más explícito y legible |
| Supabase para alojar PostgreSQL | SQLite local | Simular entorno real de producción |
| Alias `as: 'author'` en asociaciones | Sin alias | Consistencia con convenciones en inglés |

---

### Verificación final — API funcionando

**Servidor corriendo y SQL generado por Sequelize:**
![Server running](docs/screenshots/01-server-running-with-sql-query.png)

**Esquema de base de datos en Supabase:**
![Supabase schema](docs/screenshots/02-supabase-schema-authors-posts.png)

---

## Estado actual del proyecto

- [x] Servidor Express funcionando
- [x] Conexión a PostgreSQL (Supabase)
- [x] Modelos `Author` y `Post` con relación 1:N
- [x] Migraciones ejecutadas exitosamente
- [x] `GET /api/posts` devuelve lista con autor incluido
- [ ] Endpoints POST, PUT, DELETE
- [ ] Autenticación
- [ ] Seeders con datos de prueba
