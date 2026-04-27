const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const { verificarToken } = require('../middleware/auth')

// Obtener mesas de un negocio (público)
router.get('/negocio/:negocioId', async (req, res) => {
  try {
    const mesas = await prisma.mesa.findMany({
      where: {
        negocioId: parseInt(req.params.negocioId),
        activa: true
      }
    })
    res.json(mesas)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mesas' })
  }
})

// Crear mesa (solo hostelero)
router.post('/', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'HOSTELERO') {
    return res.status(403).json({ error: 'Solo los hosteleros pueden crear mesas' })
  }
  const { negocioId, etiqueta, capacidad, posX, posY, ancho, alto } = req.body
  try {
    const mesa = await prisma.mesa.create({
      data: {
        negocioId: parseInt(negocioId),
        etiqueta,
        capacidad: parseInt(capacidad),
        posX: posX || 0,
        posY: posY || 0,
        ancho: ancho || 80,
        alto: alto || 80
      }
    })
    res.status(201).json(mesa)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear mesa' })
  }
})

// Actualizar posición de mesa en el plano (drag & drop)
router.put('/:id/posicion', verificarToken, async (req, res) => {
  const { posX, posY } = req.body
  try {
    const mesa = await prisma.mesa.update({
      where: { id: parseInt(req.params.id) },
      data: { posX, posY }
    })
    res.json(mesa)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar posición' })
  }
})

// Actualizar mesa completa
router.put('/:id', verificarToken, async (req, res) => {
  const { etiqueta, capacidad, posX, posY, ancho, alto, activa } = req.body
  try {
    const mesa = await prisma.mesa.update({
      where: { id: parseInt(req.params.id) },
      data: { etiqueta, capacidad, posX, posY, ancho, alto, activa }
    })
    res.json(mesa)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar mesa' })
  }
})

// Eliminar mesa
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await prisma.mesa.update({
      where: { id: parseInt(req.params.id) },
      data: { activa: false }
    })
    res.json({ mensaje: 'Mesa eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar mesa' })
  }
})

module.exports = router