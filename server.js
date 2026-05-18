const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '.')));

// Para cualquier ruta no encontrada, servir index.html (para React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Padel4You.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Frontend Padel4You escuchando en puerto ${PORT}`);
});
