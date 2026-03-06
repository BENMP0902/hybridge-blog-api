// ============================================================
// hybridge-blog-api/index.js  (ARCHIVO PRINCIPAL DEL SERVIDOR)
// ============================================================
// Este archivo es el punto de entrada de tu aplicación.
// Ejecutas: npm run dev  (que corre: nodemon index.js)
// ============================================================

// --- 1. CARGAR VARIABLES DE ENTORNO ---
// Debe ir ANTES de cualquier otro import
// Lee el archivo .env y pone DATABASE_URL en process.env
require('dotenv').config({ silent: true });

// --- 2. IMPORTS ---
const express = require('express');

// Importa los modelos desde models/index.js (el auto-loader)
// db contiene: db.Author, db.Post, db.sequelize
const db = require('./models');

// Extraer los modelos para uso directo
// Esto es equivalente a: const Author = db.Author; const Post = db.Post;
const { Author, Post } = db;

// --- 3. CONFIGURACIÓN DE EXPRESS ---
const app = express();
const PORT = 3000;

// Middleware para parsear JSON en el body de las peticiones
// limit: '10kb' previene ataques DoS con payloads gigantes
app.use(express.json({ limit: '10kb' }));

// Desactivar el header X-Powered-By para no revelar que usamos Express
// SECURITY: Información innecesaria para el cliente, útil para atacantes
app.disable('x-powered-by');


// ============================================================
// RUTAS: AUTHOR CRUD
// ============================================================

// ----- CREATE AUTHOR -----
// POST /api/authors
// Body: { "name": "Ben" }
// Response: 201 Created + objeto creado
app.post('/api/authors', async (req, res) => {
  try {
    const { name } = req.body;

    // Validación: campo requerido
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    // Validación: tipo correcto
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'name must be a string' });
    }
    // Validación: longitud (trim elimina espacios al inicio/final)
    if (name.trim().length === 0 || name.trim().length > 100) {
      return res.status(400).json({ error: 'name must be between 1 and 100 characters' });
    }

    // Crear en DB
    // SQL generado: INSERT INTO Authors (name, createdAt, updatedAt) VALUES ($1, $2, $3)
    const author = await Author.create({ name: name.trim() });

    res.status(201).json(author);
  } catch (error) {
    console.error('Error creating author:', error.message);
    res.status(500).json({ error: 'Failed to create author' });
  }
});


// ----- LIST AUTHORS -----
// GET /api/authors
// Response: 200 OK + array de autores
app.get('/api/authors', async (req, res) => {
  try {
    // paranoid: true ya filtra deletedAt IS NULL automáticamente
    const authors = await Author.findAll({
      include: [{ model: Post, as: 'posts' }]
    });
    res.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error.message);
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});


// ----- GET AUTHOR BY ID -----
// GET /api/authors/:id
// Response: 200 OK + objeto author  |  404 Not Found  |  400 Bad Request
app.get('/api/authors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validación: ID debe ser entero positivo
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID must be a positive integer' });
    }

    const author = await Author.findByPk(id, {
      include: [{ model: Post, as: 'posts' }]
    });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    res.json(author);
  } catch (error) {
    console.error('Error fetching author:', error.message);
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});


// ----- UPDATE AUTHOR -----
// PATCH /api/authors/:id
// Body: { "name": "New Name" }
// Response: 200 OK + objeto actualizado  |  404  |  400
app.patch('/api/authors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID must be a positive integer' });
    }

    const author = await Author.findByPk(id);

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Whitelist: solo extraemos campos permitidos del body
    const { name } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'name must be a non-empty string' });
      }
      author.name = name.trim();
    }

    // save() solo actualiza los campos que cambiaron (dirty tracking)
    // SQL: UPDATE Authors SET name=$1, updatedAt=$2 WHERE id=$3
    await author.save();
    res.json(author);
  } catch (error) {
    console.error('Error updating author:', error.message);
    res.status(500).json({ error: 'Failed to update author' });
  }
});


// ----- DELETE AUTHOR -----
// DELETE /api/authors/:id
// Response: 204 No Content  |  404  |  400
app.delete('/api/authors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID must be a positive integer' });
    }

    const author = await Author.findByPk(id);

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Con paranoid: true, esto ejecuta:
    // UPDATE Authors SET deletedAt = NOW() WHERE id = $1
    // Los datos NO se eliminan físicamente (soft delete)
    await author.destroy();

    // 204 No Content: operación exitosa, sin body de respuesta
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting author:', error.message);
    res.status(500).json({ error: 'Failed to delete author' });
  }
});


// ============================================================
// RUTAS: POST CRUD
// ============================================================

// ----- CREATE POST -----
// POST /api/posts
// Body: { "title": "Mi post", "content": "Contenido...", "authorId": 1 }
// Response: 201 Created + objeto con datos del author incluidos
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, authorId } = req.body;

    // Validación: campos requeridos
    if (!title || !content || !authorId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'content', 'authorId']
      });
    }

    // Validación: tipos correctos
    if (typeof title !== 'string' || typeof content !== 'string') {
      return res.status(400).json({ error: 'title and content must be strings' });
    }

    // Validación: longitud
    if (title.trim().length === 0 || title.trim().length > 200) {
      return res.status(400).json({ error: 'title must be 1-200 characters' });
    }
    if (content.trim().length === 0 || content.trim().length > 50000) {
      return res.status(400).json({ error: 'content must be 1-50000 characters' });
    }

    // Verificar que el Author existe antes de crear el Post
    // SECURITY: sin esto, se crean Posts con authorId inexistente
    const authorExists = await Author.findByPk(authorId);
    if (!authorExists) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Crear en DB
    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      authorId
    });

    // Recargar con include para devolver el post con datos del autor
    const postWithAuthor = await Post.findByPk(post.id, {
      include: [{ model: Author, as: 'author' }]
    });

    res.status(201).json(postWithAuthor);
  } catch (error) {
    console.error('Error creating post:', error.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});


// ----- LIST POSTS -----
// GET /api/posts
// Response: 200 OK + array de posts con author incluido
app.get('/api/posts', async (req, res) => {
  try {
    // paranoid: true filtra deletedAt IS NULL automáticamente
    // NO necesitas where: { deletedAt: null }
    const posts = await Post.findAll({
      include: [{ model: Author, as: 'author' }],
      order: [['createdAt', 'DESC']]  // Más recientes primero
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});


// ----- GET POST BY ID -----
// GET /api/posts/:id
// Response: 200 OK + objeto post  |  404  |  400
app.get('/api/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID must be a positive integer' });
    }

    const post = await Post.findByPk(id, {
      include: [{ model: Author, as: 'author' }]
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error.message);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});


// ----- UPDATE POST -----
// PATCH /api/posts/:id
// Body: { "title": "Nuevo título" }  (cualquier combinación de campos)
// Response: 200 OK + objeto actualizado  |  404  |  400
app.patch('/api/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID must be a positive integer' });
    }

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Whitelist: solo campos permitidos del body
    const { title, content, authorId } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'title must be a non-empty string' });
      }
      post.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'content must be a non-empty string' });
      }
      post.content = content.trim();
    }

    if (authorId !== undefined) {
      // Si cambian el author, verificar que el nuevo existe
      const authorExists = await Author.findByPk(authorId);
      if (!authorExists) {
        return res.status(404).json({ error: 'Author not found' });
      }
      post.authorId = authorId;
    }

    await post.save();

    // Recargar con include para devolver datos completos
    const updatedPost = await Post.findByPk(post.id, {
      include: [{ model: Author, as: 'author' }]
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error.message);
    res.status(500).json({ error: 'Failed to update post' });
  }
});


// ----- DELETE POST -----
// DELETE /api/posts/:id
// Response: 204 No Content  |  404  |  400
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID must be a positive integer' });
    }

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Soft delete: UPDATE SET deletedAt = NOW()
    await post.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error.message);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});


// ============================================================
// MIDDLEWARE 404 (debe ir DESPUÉS de todas las rutas)
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});


// ============================================================
// MIDDLEWARE DE ERROR GLOBAL (4 parámetros = error handler)
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});


// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});