const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
global.prisma = prisma

prisma.$connect()
  .then(() => console.log('Base de datos conectada correctamente'))
  .catch(e => console.error('Error conectando BD:', e.message))

const authRoutes = require('./routes/auth')
const negociosRoutes = require('./routes/negocios')
const mesasRoutes = require('./routes/mesas')
const reservasRoutes = require('./routes/reservas')
const paredesRoutes = require('./routes/paredes')
const turnosRoutes = require('./routes/turnos')
const diasBloqueadosRoutes = require('./routes/diasBloqueados')
const menusRoutes = require('./routes/menus')
const platosRoutes = require('./routes/platos')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/negocios', negociosRoutes)
app.use('/api/mesas', mesasRoutes)
app.use('/api/reservas', reservasRoutes)
app.use('/api/paredes', paredesRoutes)
app.use('/api/turnos', turnosRoutes)
app.use('/api/dias-bloqueados', diasBloqueadosRoutes)
app.use('/api/menus', menusRoutes)
app.use('/api/platos', platosRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'API EntrePlazas funcionando' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})