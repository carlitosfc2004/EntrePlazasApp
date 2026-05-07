const { PrismaClient } = require('@prisma/client')

console.log('Intentando crear PrismaClient...')
console.log('PrismaClient:', typeof PrismaClient)

let prisma

try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  console.log('PrismaClient creado correctamente')
} catch (error) {
  console.error('Error creando PrismaClient:', error.message)
}

module.exports = global.prisma