const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/')
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `negocio_${req.usuario.id}_${Date.now()}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp']
    if (permitidos.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'))
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

module.exports = upload