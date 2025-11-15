import { PrismaClient, MuscleGroup } from '../generated/prisma'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set as environment variables')
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      name: 'Admin',
    },
  })

  const exercises = [
    { name: 'Remada Articulada', muscleGroup: MuscleGroup.BACK },
    { name: 'Remada Curvada Barra', muscleGroup: MuscleGroup.BACK },
    { name: 'Puxada Aberta Cabo', muscleGroup: MuscleGroup.BACK },
    { name: 'Remada Baixa Unilateral Cabo', muscleGroup: MuscleGroup.BACK },
    { name: 'Voador Inverso', muscleGroup: MuscleGroup.BACK },
    { name: 'Remada Alta Unilateral Halter', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Desenvolvimento Ombro Barra', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Desenvolvimento Ombro Articulado', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Elevacao Lateral Halter', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Supino Inclinado Halter', muscleGroup: MuscleGroup.CHEST },
    { name: 'Supino Reto Halter', muscleGroup: MuscleGroup.CHEST },
    { name: 'Voador', muscleGroup: MuscleGroup.CHEST },
    { name: 'Agachamento Livre', muscleGroup: MuscleGroup.LEGS },
    { name: 'Extensora', muscleGroup: MuscleGroup.LEGS },
    { name: 'Flexora Deitado', muscleGroup: MuscleGroup.LEGS },
    { name: 'Flexora Sentado', muscleGroup: MuscleGroup.LEGS },
    { name: 'Afundo Unilateral Halter', muscleGroup: MuscleGroup.LEGS },
    { name: 'Panturrilha Sentado', muscleGroup: MuscleGroup.LEGS },
    { name: 'Panturrilha Extendido', muscleGroup: MuscleGroup.LEGS },
    { name: 'Elevacao Pelvica Barra', muscleGroup: MuscleGroup.LEGS },
    { name: 'Terra Sumo', muscleGroup: MuscleGroup.LEGS },
    { name: 'Rosca Direta Barra W', muscleGroup: MuscleGroup.BICEPS },
    { name: 'Rosca 45', muscleGroup: MuscleGroup.BICEPS },
    { name: 'Rosca Inv Barra W', muscleGroup: MuscleGroup.BICEPS },
    { name: 'Frances Cabo', muscleGroup: MuscleGroup.TRICEPS },
    { name: 'Extensao Triceps Cabo', muscleGroup: MuscleGroup.TRICEPS },
    { name: 'Abdominal Maquina', muscleGroup: MuscleGroup.CORE },
    { name: 'Elevacao Perna Pendurado', muscleGroup: MuscleGroup.CORE },
    { name: 'Prancha Bola', muscleGroup: MuscleGroup.CORE },
    { name: 'Canoa', muscleGroup: MuscleGroup.CORE },
    { name: 'Superman', muscleGroup: MuscleGroup.CORE },
  ]

  for (const e of exercises) {
    await prisma.exercise.upsert({
      where: { name: e.name },
      update: {},
      create: {
        ...e,
        isGlobal: true,
        createdById: admin.id,
      },
    })
  }

  console.log(`✅ Seed complete for ${adminEmail}: ${exercises.length} exercises.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
