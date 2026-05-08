const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
},

async (req, accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value
        const nombre = profile.name.givenName || profile.displayName
        const apellidos = profile.name.familyName || ''
        const rolSolicitado = req.query.state || 'CLIENTE'

        let usuario = await prisma.usuario.findUnique({ where: { email } })

        if (!usuario) {
            usuario = await prisma.usuario.create({
                data: {
                    nombre,
                    apellidos,
                    email,
                    passwordHash: 'google-oauth',
                    rol: rolSolicitado === 'HOSTELERO' ? 'HOSTELERO' : 'CLIENTE'
                }
            })
        }
        return done(null, usuario)
    } catch (error) {
        return done(error, null)
    }
}))

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.usuario.findUnique({ where: { id } })
        done(null, user)
    } catch (err) {
        done(err, null)
    }
})

module.exports = passport