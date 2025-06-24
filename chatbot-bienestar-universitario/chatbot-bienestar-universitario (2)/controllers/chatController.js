async function guardarMensajeEnHistorial(userId, mensajeUsuario, respuestaBot) {
  const ref = db.collection('historial').doc(userId);
  await ref.set({
    mensajes: firebaseAdmin.firestore.FieldValue.arrayUnion({
      pregunta: mensajeUsuario,
      respuesta: respuestaBot,
      timestamp: new Date()
    })
  }, { merge: true });
}


module.exports = {
  guardarMensajeEnHistorial
};
