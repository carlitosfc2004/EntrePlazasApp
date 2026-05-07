const cloudinary = require('cloudinary').v2
const multer = require('multer')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = multer.memoryStorage()

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

const subirACloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
        { folder: 'entreplazas', resource_type: 'image' },
        (error, result) => {
            if (error) reject(error)
            else resolve(result)
        }
        ).end(buffer)
    })
}

module.exports = { upload, subirACloudinary }