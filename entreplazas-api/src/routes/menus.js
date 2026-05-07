const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verificarToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Obtener menús de un negocio (público) - va PRIMERO
router.get('/negocio/:negocioId/publico', async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({
      where: { negocioId: parseInt(req.params.negocioId), activo: true },
      include: { platos: { where: { disponible: true } } }
    })
    res.json(menus)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener menús' })
  }
})

// Obtener menús de un negocio (protegido) - va DESPUÉS
router.get('/negocio/:negocioId', verificarToken, async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({
      where: { negocioId: parseInt(req.params.negocioId), activo: true },
      include: { platos: { where: { disponible: true } } }
    })
    res.json(menus)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener menús' })
  }
})

// Crear nuevo menú
router.post('/', verificarToken, async (req, res) => {
  const { negocioId, nombre } = req.body
  try {
    const menu = await prisma.menu.create({
      data: { negocioId: parseInt(negocioId), nombre }
    })
    res.status(201).json(menu)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear menú' })
  }
})

// Eliminar menú
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await prisma.menu.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false }
    })
    res.json({ mensaje: 'Menú eliminado' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar menú' })
  }
})

module.exports = router