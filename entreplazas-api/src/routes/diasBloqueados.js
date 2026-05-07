const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verificarToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// Obtener días bloqueados de un negocio
router.get('/negocio/:negocioId', async (req, res) => {
    try {
        const dias = await prisma.diasBloqueado.findMany({
            where: { negocioId: parseInt(req.params.negocioId) }
        })
        res.json(dias)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener días bloqueados' })
    }
})

// Bloquear un día
router.post('/', verificarToken, async (req, res) => {
    const { negocioId, fecha, motivo } = req.body
    try {
        const dia = await prisma.diasBloqueado.create({
            data: {
                negocioId: parseInt(negocioId),
                fecha: new Date(fecha),
                motivo: motivo || null
            }
        })
        res.status(201).json(dia)
    } catch (error) {
        res.status(500).json({ error: 'Error al bloquear día' })
    }
})

// Desbloquear un día
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await prisma.diasBloqueado.delete({
            where: { id: parseInt(req.params.id) }
        })
        res.json({ mensaje: 'Día desbloqueado correctamente' })
    } catch (error) {
        res.status(500).json({ error: 'Error al desbloquear día' })
    }
})

module.exports = router