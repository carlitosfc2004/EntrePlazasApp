const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verificarToken } = require('../middleware/auth')

const prisma = new PrismaClient()

router.put('/mi-cuenta', verificarToken, async (req, res) => {
    const { telefono } = req.body
    try {
        const usuario = await prisma.usuario.update({
            where: { id: req.usuario.id },
            data: { telefono }
        })
        res.json({ id: usuario.id, nombre: usuario.nombre, telefono: usuario.telefono })
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el perfil' })
    }
})

module.exports = router