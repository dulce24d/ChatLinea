const socket = io() // Conectar al servidor de socket.io
//Se conecta con los elementos del index.html
const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

// Solicitar el nombre del usuario
let name = ''
do {
  name = prompt('Escribe tu nombre:')
} while (!name)

socket.emit('new-user', name)

//si el nombre de usuario ya esta en uso
socket.on('username-taken', () => {
  alert('Nombre en uso. Intenta con otro.')
  location.reload()
})

//Mostrar el historial de mensajes al cargar la página
socket.on('chat-history', history => {
  history.forEach(data => {
    appendMessage(`${data.name}: ${data.message}`, data.color)
  })
})

// Mostrar mensajes nuevos en tiempo real
socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`, data.color)
})
// Notificar cuando un usuario se conecta o desconecta
socket.on('user-connected', data => {
  appendMessage(`${data.name} se ha conectado`, '#888')
})
socket.on('user-disconnected', name => {
  appendMessage(`${name} se ha desconectado`, '#888')
})

//Envia los mensajes
messageForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = messageInput.value.trim()
  if (message === '') return
  socket.emit('send-chat-message', message)
  messageInput.value = ''
})

//Muestra los mensajes en el contenedor
function appendMessage(message, color = '#000') {
  const msgEl = document.createElement('div')
  msgEl.innerText = message
  msgEl.style.color = color
  messageContainer.appendChild(msgEl)
  messageContainer.scrollTop = messageContainer.scrollHeight
}

