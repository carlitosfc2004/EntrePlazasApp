const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const negociosRoutes = require('./routes/negocios')
const mesasRoutes = require('./routes/mesas')
const reservasRoutes = require('./routes/reservas')
const paredesRoutes = require('./routes/paredes')
const turnosRoutes = require('./routes/turnos')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/uploads', express.static('src/uploads'))
app.use('/api/auth', authRoutes)
app.use('/api/negocios', negociosRoutes)
app.use('/api/mesas', mesasRoutes)
app.use('/api/reservas', reservasRoutes)
app.use('/api/paredes', paredesRoutes)
app.use('/api/turnos', turnosRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'API EntrePlazas funcionando' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})