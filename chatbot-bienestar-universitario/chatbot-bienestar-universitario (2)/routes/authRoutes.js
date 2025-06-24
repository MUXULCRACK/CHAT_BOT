// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.get('/login', (req, res) => res.render('login'));
router.post('/login', auth.iniciarSesion);

router.get('/register', (req, res) => res.render('register'));
router.post('/register', auth.registrarUsuario);

router.get('/logout', auth.logout);

module.exports = router;
