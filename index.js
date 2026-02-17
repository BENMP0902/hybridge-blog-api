// index.js

// 1. Configuración de variables de entorno
require('dotenv').config({ silent: true });

// 2. Imports
const express = require('express');
const { Post, Author } = require('./models');

// 3. Configuración de Express
const app = express();
const PORT = process.env.PORT || 3000;

// 4. Middleware
app.use(express.json());

// 5. Rutas

// Ruta raíz (para que no dé "Cannot GET /")
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Hybridge Blog',
    endpoints: {
      posts: '/api/posts'
    }
  });
});

// GET - Obtener todos los posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [{ model: Author, as: 'author' }],
      where: { deletedAt: null }
    });
    res.json(posts);
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener posts' });
  }
});

// 6. Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});