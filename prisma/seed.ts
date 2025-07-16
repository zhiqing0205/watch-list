import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Database seeding started...')
  
  // 检查是否已经有用户
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    console.log('Database already has users, skipping seed')
    return
  }
  
  console.log('Database seeding completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })