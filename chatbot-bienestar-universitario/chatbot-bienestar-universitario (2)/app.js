const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const chatRoutes = require('./routes/chatRoutes');


const firebaseAdmin = require('firebase-admin');
const { GoogleGenAI } = require('@google/genai');
const authRoutes = require('./routes/authRoutes');

// Inicializar Firebase
const serviceAccount = require('./firebase-key.json');
const { db } = require('./firebase');


// Inicializar Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Crear app
const app = express();
const port = 4040;

// 🟩 Middleware en orden correcto
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  store: new SQLiteStore(),
  secret: 'bienestar-universitario',
  resave: false,
  saveUninitialized: false
}));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🟩 Rutas de autenticación
app.use('/', authRoutes);
app.use('/', chatRoutes); // ✅
// 🟩 Middleware de autenticación
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

app.get('/chat', isAuthenticated, (req, res) => {
  res.render('chat', { user: req.session.nombre });
});

app.get('/historial', isAuthenticated, (req, res) => {
  res.render('historial', { userName: req.session.userName });
});


// Función con Gemini 1.5-Flash
async function obtenerInfoConIA(query) {
  // 1. Colección: Servicios
  const serviciosSnapshot = await db.collection("Servicios").get();
  const servicios = [];
  serviciosSnapshot.forEach(doc => {
    const d = doc.data();
    servicios.push(`• ${d.nombre}: ${d.descripcion}. Disponible en: ${d.disponibilidad.join(", ")}`);
  });

  // 2. Colección: citas_bienestar/citas_medicas
  const citasMedicasDoc = await db.collection("citas_bienestar").doc("citas_medicas").get();
  const citas = citasMedicasDoc.data();
  const citasTexto = `
📆 Citas Médicas:
${Object.entries(citas.contacto).map(([sede, info]) =>
  `- ${sede}: ${info.celular}`).join("\n")}

🕒 Horario:
- Días: ${citas.horario.dias}
- Mañana: ${citas.horario.mañana}
- Tarde: ${citas.horario.tarde}
- Título: ${citas.horario.titulo}
`;

  // 3. Colección: contactos/lineas_atencion
  const contactosDoc = await db.collection("contactos").doc("lineas_atencion").get();
  const contactos = contactosDoc.data();
  const contactosTexto = `
📞 Líneas de Atención:
${Object.entries(contactos.telefonos).map(([sede, num]) =>
  `- ${sede}: ${num}`).join("\n")}

📧 Correos:
${Object.entries(contactos.correos).map(([area, correo]) =>
  `- ${area}: ${correo}`).join("\n")}
`;

  // 4. Colección: tramites
  const tramitesSnapshot = await db.collection("tramites").get();
  const tramites = [];
  tramitesSnapshot.forEach(doc => {
    const d = doc.data();
    tramites.push(`📌 Trámite: ${d.descripcion}`);
  });

  // PROMPT para Gemini
  const prompt = `
Eres un asistente virtual profesional de Bienestar Universitario de la Universidad de Pamplona. Tu objetivo es responder preguntas de estudiantes 
usando la siguiente base de datos. Las respuestas deben estar bien redactadas, en lenguaje claro y formal, 
SIN NINGÚN ASTERISCOS, sin guiones, puedes responder con emojis, sin formato Markdown.

============================
SERVICIOS:
${servicios.join("\n")}

============================
CITAS MÉDICAS:
${citasTexto}

============================
LÍNEAS DE ATENCIÓN:
${contactosTexto}

============================
TRÁMITES:
${tramites.join("\n")}

============================
PREGUNTA:
"${query}"

RESPUESTA:
Redacta una respuesta clara, amable y estructurada basada en los datos anteriores. Si no tienes la información, indica que puedes conseguirla o indaga en internet.
`;

  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });

  return result.text;
}


// Ruta chatbot
app.post('/mensaje', async (req, res) => {
  try {
    const respuesta = await obtenerInfoConIA(req.body.message);
    res.json({ response: respuesta });
  } catch (e) {
    console.error(e);
    res.json({ response: "Hubo un error con la IA." });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}/login`);
});
