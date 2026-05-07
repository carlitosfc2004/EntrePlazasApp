const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verificarToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Obtener paredes de un negocio
router.get('/negocio/:negocioId', async (req, res) => {
    try {
        const paredes = await prisma.pared.findMany({
            where: { negocioId: parseInt(req.params.negocioId) }
        })
        res.json(paredes)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener paredes' })
    }
})

// Crear pared
router.post('/', verificarToken, async (req, res) => {
    const { negocioId, x1, y1, x2, y2, grosor } = req.body
    try {
        const pared = await prisma.pared.create({
            data: {
                negocioId: parseInt(negocioId),
                x1, y1, x2, y2,
                grosor: grosor || 8
            }
        })
        res.status(201).json(pared)
    } catch (error) {
        res.status(500).json({ error: 'Error al crear pared' })
    }
})

// Eliminar pared
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await prisma.pared.delete({
            where: { id: parseInt(req.params.id) }
        })
        res.json({ mensaje: 'Pared eliminada' })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar pared' })
    }
})

module.exports = router