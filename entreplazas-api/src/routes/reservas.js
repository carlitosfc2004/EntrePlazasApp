const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const { verificarToken } = require('../middleware/auth')

// Obtener disponibilidad por negocio, fecha y turno
router.get('/disponibilidad/:negocioId/:fecha/:turnoId', async (req, res) => {
  const { negocioId, fecha, turnoId } = req.params
  try {
    const reservasDelDia = await prisma.reserva.findMany({
      where: {
        negocioId: parseInt(negocioId),
        fecha: new Date(fecha),
        turnoId: parseInt(turnoId),
        estado: { not: 'CANCELADA' }
      },
      select: { mesaId: true }
    })
    const mesasOcupadas = reservasDelDia.map(r => r.mesaId)
    res.json({ mesasOcupadas })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener disponibilidad' })
  }
})

// Crear reserva (usuario logueado)
router.post('/', verificarToken, async (req, res) => {
  const { mesaId, negocioId, fecha, horaInicio, nombreContacto, numPersonas, turnoId, telefono, estado } = req.body
  try {
    const reservaExistente = await prisma.reserva.findFirst({
      where: {
        mesaId: parseInt(mesaId),
        fecha: new Date(fecha),
        turnoId: parseInt(turnoId),
        estado: { not: 'CANCELADA' }
      }
    })
    if (reservaExistente) {
      return res.status(400).json({ error: 'Esta mesa ya está reservada para ese turno' })
    }

    const reserva = await prisma.reserva.create({
      data: {
        mesaId: parseInt(mesaId),
        usuarioId: req.usuario.id,
        negocioId: parseInt(negocioId),
        fecha: new Date(fecha),
        horaInicio,
        nombreContacto,
        numPersonas: parseInt(numPersonas),
        turnoId: parseInt(turnoId),
        telefono: telefono || null,
        estado: estado || 'PENDIENTE'
      }
    })
    res.status(201).json(reserva)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear reserva' })
  }
})

// Obtener reservas del usuario logueado
router.get('/mis-reservas', verificarToken, async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      where: { usuarioId: req.usuario.id },
      include: {
        mesa: true,
        negocio: { select: { nombre: true, direccion: true } }
      },
      orderBy: { fecha: 'desc' }
    })
    res.json(reservas)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reservas' })
  }
})

// Obtener reservas de un negocio (solo hostelero)
router.get('/negocio/:negocioId', verificarToken, async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      where: { negocioId: parseInt(req.params.negocioId) },
      include: {
        mesa: true,
        usuario: { select: { nombre: true, email: true, telefono: true } }
      },
      orderBy: { fecha: 'desc' }
    })
    res.json(reservas)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reservas del negocio' })
  }
})

// Cancelar reserva
router.put('/:id/cancelar', verificarToken, async (req, res) => {
  try {
    const reserva = await prisma.reserva.update({
      where: { id: parseInt(req.params.id) },
      data: { estado: 'CANCELADA' }
    })
    res.json(reserva)
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar reserva' })
  }
})

// Confirmar reserva (solo hostelero)
router.put('/:id/confirmar', verificarToken, async (req, res) => {
  try {
    const reserva = await prisma.reserva.update({
      where: { id: parseInt(req.params.id) },
      data: { estado: 'CONFIRMADA' }
    })
    res.json(reserva)
  } catch (error) {
    res.status(500).json({ error: 'Error al confirmar reserva' })
  }
})

module.exports = router