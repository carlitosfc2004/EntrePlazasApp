const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const { verificarToken } = require('../middleware/auth')
const { upload } = require('../middleware/upload')

// Obtener todos los negocios activos (público)
router.get('/', async (req, res) => {
  try {
    const negocios = await prisma.negocio.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        direccion: true,
        ciudad: true,
        telefono: true,
        imagenUrl: true,
        horarioApertura: true,
        horarioCierre: true,
      }
    })
    res.json(negocios)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener negocios' })
  }
})

// Obtener un negocio por id (público)
router.get('/:id', async (req, res) => {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        mesas: { where: { activa: true } },
        menus: {
          where: { activo: true },
          include: { platos: { where: { disponible: true } } }
        }
      }
    })
    if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado' })
    res.json(negocio)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener negocio' })
  }
})

// Crear negocio (solo hosteleros)
router.post('/', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'HOSTELERO') {
    return res.status(403).json({ error: 'Solo los hosteleros pueden crear negocios' })
  }
  const { nombre, descripcion, direccion, ciudad, telefono, horarioApertura, horarioCierre } = req.body
  try {
    const negocio = await prisma.negocio.create({
      data: {
        propietarioId: req.usuario.id,
        nombre,
        descripcion,
        direccion,
        ciudad,
        telefono,
        horarioApertura,
        horarioCierre
      }
    })
    res.status(201).json(negocio)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear negocio' })
  }
})

// Obtener el negocio del hostelero logueado
router.get('/mi/negocio', verificarToken, async (req, res) => {
  try {
    const negocio = await prisma.negocio.findFirst({
      where: { propietarioId: req.usuario.id },
      include: {
        mesas: { where: { activa: true } },
        menus: {
          where: { activo: true },
          include: { platos: true }
        }
      }
    })
    if (!negocio) return res.status(404).json({ error: 'No tienes ningún negocio registrado' })
    res.json(negocio)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tu negocio' })
  }
})

// Actualizar negocio
router.put('/:id', verificarToken, async (req, res) => {
  const { nombre, descripcion, direccion, ciudad, telefono, horarioApertura, horarioCierre } = req.body
  try {
    const negocio = await prisma.negocio.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, descripcion, direccion, ciudad, telefono, horarioApertura, horarioCierre }
    })
    res.json(negocio)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar negocio' })
  }
})

// Subir imagen del negocio
const { upload, subirACloudinary } = require('../middleware/upload')

router.post('/:id/imagen', verificarToken, upload.single('imagen'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' })
  try {
    const resultado = await subirACloudinary(req.file.buffer)
    const negocio = await prisma.negocio.update({
      where: { id: parseInt(req.params.id) },
      data: { imagenUrl: resultado.secure_url }
    })
    res.json({ imagenUrl: negocio.imagenUrl })
  } catch (error) {
    console.error('Error subiendo imagen:', error)
    res.status(500).json({ error: 'Error al guardar la imagen' })
  }
})

module.exports = router