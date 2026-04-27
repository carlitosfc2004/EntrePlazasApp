const jwt = require('jsonwebtoken')

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = usuario
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' })
  }
}

module.exports = { verificarToken }