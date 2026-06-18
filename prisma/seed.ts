import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const existing = await prisma.user.findUnique({ where: { email: 'admin@simote.app' } })
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin1234', 12)
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@simote.app',
        username: 'admin',
        passwordHash,
        role: 'admin',
      },
    })
    console.log('✓ Admin user created: admin@simote.app / admin1234')
  } else {
    console.log('✓ Admin user already exists')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
