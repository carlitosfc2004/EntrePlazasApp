const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')
const passport = require('../config/passport')
const jwt = require('jsonwebtoken')

// Registro
router.post('/registro', async (req, res) => {
  const { nombre, apellidos, email, password, telefono, rol } = req.body

  try {
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.create({
      data: { nombre, apellidos, email, passwordHash, telefono, rol: rol || 'CLIENTE' }
    })

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } })
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' })
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash)
    if (!passwordValido) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' })
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } })
  } catch (error) {
    console.error('ERROR LOGIN:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Iniciar login con Google (cliente)
router.get('/google/cliente', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: 'CLIENTE'
  })(req, res, next)
})

// Iniciar login con Google (hostelero)
router.get('/google/hostelero', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: 'HOSTELERO'
  })(req, res, next)
})

// Callback de Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const usuario = req.user
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const usuarioData = encodeURIComponent(JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol
    }))

    if (usuario.rol === 'HOSTELERO') {
      res.redirect(`${process.env.FRONTEND_EMPRESA_URL}/auth/callback?token=${token}&usuario=${usuarioData}`)
    } else {
      res.redirect(`${process.env.FRONTEND_CLIENTE_URL}/auth/callback?token=${token}&usuario=${usuarioData}`)
    }
  }
)

module.exports = router