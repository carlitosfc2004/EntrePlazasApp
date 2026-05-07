const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verificarToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Obtener turnos de un negocio (público)
router.get('/negocio/:negocioId', async (req, res) => {
  try {
    const turnos = await prisma.turno.findMany({
      where: {
        negocioId: parseInt(req.params.negocioId),
        activo: true
      }
    })
    res.json(turnos)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos' })
  }
})

// Crear turno (solo hostelero)
router.post('/', verificarToken, async (req, res) => {
    const { negocioId, nombre, horaInicio, horaFin, diasSemana } = req.body
    try {
            const turno = await prisma.turno.create({
                data: {
                    negocioId: parseInt(negocioId),
                    nombre,
                    horaInicio,
                    horaFin,
                    diasSemana: diasSemana || '0,1,2,3,4,5,6', // Por defecto todos los días
                }
            })
        res.status(201).json(turno)
    } catch (error) {
        res.status(500).json({ error: 'Error al crear turno' })
    }
})

// Eliminar turno
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await prisma.turno.delete({
            where: { id: parseInt(req.params.id) }
        })
        res.json({ mensaje: 'Turno eliminado' })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar turno' })
    }
})

module.exports = router