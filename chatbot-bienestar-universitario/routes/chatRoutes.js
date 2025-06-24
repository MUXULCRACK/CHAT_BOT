const express = require('express');
const router = express.Router();
const { obtenerHistorial } = require('../controllers/chatController');

router.get('/historial', async (req, res) => {
  try {
    const historial = await obtenerHistorial(req.session.userId);
    res.render('partials/historial', { historial }); // ✅ Asegúrate de pasar la variable
  } catch (e) {
    console.error("Error cargando historial:", e);
    res.render('partials/historial', { historial: [] }); // Para evitar romper la vista
  }
});

module.exports = router;