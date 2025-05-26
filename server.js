// Importa los módulos necesarios
const express = require('express')            // Framework web
const http = require('http')                  // Módulo HTTP nativo
const { Server } = require('socket.io')       // Socket.IO para comunicación en tiempo real
const path = require('path')                  // Para manejar rutas de archivos

const app = express()                         // Crea la aplicación Express
const server = http.createServer(app)         // Crea el servidor HTTP
const io = new Server(server)                 // Conecta Socket.IO con el servidor

// Inicia el servidor escuchando en el puerto 8080 y en todas las IPs (0.0.0.0) para que otras PCs puedan acceder
server.listen(8080, '0.0.0.0', () => {
  console.log('Servidor corriendo en http://148.213.41.145:8080')
})

// Sirve los archivos estáticos (HTML, JS, CSS) desde la carpeta donde está este archivo
app.use(express.static(__dirname))

// Almacena usuarios conectados
const users = {}
// Set para evitar nombres repetidos
const userNames = new Set()

// Colores que se asignarán a los usuarios para identificar sus mensajes
const colors = [
  '#ff6f61', '#6ec6ff', '#81c784', '#ffd54f',
  '#4db6ac', '#ff8a65', '#ffb74d', '#f06292'
]

let colorIndex = 0            // Para rotar colores
const messages = []           // Historial de mensajes

// Evento que se dispara cuando un cliente se conecta
io.on('connection', socket => {
  
  // Espera el nombre del nuevo usuario
  socket.on('new-user', name => {
    if (userNames.has(name)) {
      // Si el nombre ya está en uso, notifica al cliente
      socket.emit('username-taken')
      return
    }

    // Asigna color al usuario y guarda sus datos
    const color = colors[colorIndex % colors.length]
    colorIndex++

    users[socket.id] = { name, color }  // Asocia nombre y color al socket
    userNames.add(name)                 // Agrega el nombre al set

    // Envía el historial de mensajes al nuevo usuario
    socket.emit('chat-history', messages)

    // Notifica a todos los demás que se conectó un nuevo usuario
    socket.broadcast.emit('user-connected', { name })

    // Maneja el envío de mensajes desde este usuario
    socket.on('send-chat-message', message => {
      const safeMsg = sanitize(message)  // Limpia el mensaje
      const user = users[socket.id]      // Obtiene datos del usuario
      const data = {
        message: safeMsg,
        name: user.name,
        color: user.color
      }
      messages.push(data)           // Guarda el mensaje en el historial
      io.emit('chat-message', data) // Lo envía a todos los conectados
    })

    // Evento cuando el usuario se desconecta
    socket.on('disconnect', () => {
      const user = users[socket.id]
      if (user) {
        socket.broadcast.emit('user-disconnected', user.name) // Notifica a otros
        userNames.delete(user.name)  // Elimina el nombre del set
        delete users[socket.id]      // Borra al usuario del objeto
      }
    })
  })
})

// Función para limpiar caracteres peligrosos del mensaje
function sanitize(str) {
  return str.replace(/[&<>"']/g, tag => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[tag]
  ))
}

