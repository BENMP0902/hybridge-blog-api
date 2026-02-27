// index.js
// =========================================================
// Hybridge Blog API - CRUD con Express.js
// =========================================================


// 1. Configuración de variables de entorno
require('dotenv').config({ silent: true });

// 2. Imports
const express = require('express');
const posts = require('./posts')
const { Post, Author } = require('./models');

// 3. Configuración de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 4. Middlewares Globales
app.disable('x-power-by');                     // Ocultar header Express
app.use(express.json({  limit: '10kb'  }));    // Parsear JSON con limite

// 5. Rutas

// Ruta raíz (para que no dé "Cannot GET /")
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a la API de Hybridge Blog',
    endpoints: {
      posts: '/api/posts'
    }
  });
});

// --- CRUD-POST ---
// GET - Obtener todos los posts
// --- READ: Obtener todos los posts ---
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [{ model: Author, as: 'author' }],   // LEFT JOIN
      where: { deletedAt: null }
    });
    res.json(posts);
  } catch (error) {
    // SECURITY: log interno completo, respuesta géneroca al cliente
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- READ: Obtener post por ID ---
app.get('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST - Crear un nuevo post
// Endpoint: POST /api/posts
// Status: 201 Created
app.post('/api/posts', (req, res) => {
  const { title, content, author } = req.body;

  const newPost = {
    // SECURITY: NO uses posts.length + 1 como ID en producción
    // Si eliminas posts, los IDs se repiten. Usa UUID o auto-increment de DB
    id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
    title: sanitize(title.trim()),     // trim() elimina espacios
    content: sanitize(content.trim()),
    author: sanitize(author.trim()),
    date: new Date()
  };

  posts.push(newPost);
  res.status(201).json(newPost);  // 201 = recurso creado
});

// PUT - Reemplazar un post completo
// Semántica: TODOS los campos deben estar presentes
app.put('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const postIndex = posts.findIndex(p => p.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { title, content, author } = req.body;

  // PUT requiere TODOS los campos (reemplazo completo)
  if (!title || !content || !author) {
    return res.status(400).json({
      error: 'PUT requires all fields: title, content, author'
    });
  }
  // Preservar el ID y la fecha de creación original
  posts[postIndex] = {
    ...posts[postIndex],       // Preserva id y date originales
    title: title.trim(),
    content: content.trim(),
    author: author.trim(),
    updatedAt: new Date()       // Registrar cuándo se modificó
  };

  res.json(posts[postIndex]);
});

// PATCH - Actualizar campos específicos
// Semántica: solo los campos enviados se actualizan
app.patch('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const postIndex = posts.findIndex(p => p.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { title, content, author } = req.body;

  // SECURITY: solo actualizar campos permitidos (whitelist)
  // Nunca hagas Object.assign(post, req.body) directamente
  // Un atacante podría enviar { id: 999, role: 'admin' }
  if (title) posts[postIndex].title = title.trim();
  if (content) posts[postIndex].content = content.trim();
  if (author) posts[postIndex].author = author.trim();
  posts[postIndex].updatedAt = new Date();

  res.json(posts[postIndex]);
});

// DELETE - Eliminar un post
// Endpoint: DELETE /api/posts/:id
// Status: 204 No Content (sin body de respuesta)
app.delete('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const postIndex = posts.findIndex(p => p.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  // splice modifica el array original: elimina 1 elemento en postIndex
  posts.splice(postIndex, 1);

  // 204 = éxito sin contenido de respuesta
  // res.send() sin argumento o res.end() evita enviar body
  res.status(204).send();
});


// 6. Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});