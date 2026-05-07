const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verificarToken } = require('../middleware/auth')
const { upload, subirACloudinary } = require('../middleware/upload')

const prisma = new PrismaClient()

router.post('/', verificarToken, async (req, res) => {
    const { menuId, nombre, descripcion, precio, categoria } = req.body
    try {
        const plato = await prisma.plato.create({
        data: {
            menuId: parseInt(menuId),
            nombre,
            descripcion,
            precio: precio ? parseFloat(precio) : null,
            categoria
        }
        })
        res.status(201).json(plato)
    } catch (error) {
        res.status(500).json({ error: 'Error al crear plato' })
    }
})

router.post('/:id/imagen', verificarToken, upload.single('imagen'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' })
    try {
        const resultado = await subirACloudinary(req.file.buffer)
        const plato = await prisma.plato.update({
            where: { id: parseInt(req.params.id) },
            data: { imagenUrl: resultado.secure_url }
        })
        res.json({ imagenUrl: plato.imagenUrl })
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar imagen del plato' })
    }
})

router.delete('/:id', verificarToken, async (req, res) => {
    try {
        await prisma.plato.update({
            where: { id: parseInt(req.params.id) },
            data: { disponible: false }
        })
        res.json({ mensaje: 'Plato eliminado' })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar plato' })
    }
})

module.exports = router