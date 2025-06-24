function sendMessage() {
  const userInput = document.getElementById("user-input").value.trim();
  if (userInput === "") return;

  const messageContainer = document.getElementById("chat-box");
  messageContainer.innerHTML += `<p><strong>Tú:</strong> ${userInput}</p>`;

  fetch('/mensaje', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userInput })
  })
  .then(res => res.json())
  .then(data => {
    messageContainer.innerHTML += `<p><strong>Bot:</strong> ${data.response}</p>`;
    document.getElementById("user-input").value = "";
    messageContainer.scrollTop = messageContainer.scrollHeight;
  });
}

// Activar Enter
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("user-input");
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // En caso tengas un botón con id="send_btn", si no existe puedes omitir esta línea
  const btn = document.getElementById("send_btn");
  if (btn) {
    btn.addEventListener("click", sendMessage);
  }
});
