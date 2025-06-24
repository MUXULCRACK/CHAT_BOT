const bcrypt = require('bcrypt');
const db = require('../db/conexion');

exports.registrarUsuario = async (req, res) => {
  const { nombre, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.run(`INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`,
    [nombre, email, hash],
    function (err) {
      if (err) return res.send('Error al registrar usuario.');
      req.session.userId = this.lastID;
      res.redirect('/login?registro=exitoso');
    });
};

exports.iniciarSesion = (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.send('Credenciales inválidas.');
    }
    req.session.userId = user.id;
    res.redirect('/chat');
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};
