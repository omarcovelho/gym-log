import { PrismaClient, MuscleGroup, Feeling, EffortUnit } from '../generated/prisma'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting evolution seed...')

  // Criar ou buscar usuário de teste
  const testUser = await prisma.user.upsert({
    where: { email: 'test@evolution.com' },
    update: {},
    create: {
      email: 'test@evolution.com',
      password: await bcrypt.hash('test123', 10),
      name: 'Test User',
      height: 175,
      weight: 75,
    },
  })

  console.log(`✅ User created/found: ${testUser.email}`)

  // Criar exercícios com diferentes grupos musculares
  const exercises = [
    { name: 'Supino Reto Barra', muscleGroup: MuscleGroup.CHEST },
    { name: 'Supino Inclinado Halter', muscleGroup: MuscleGroup.CHEST },
    { name: 'Remada Curvada Barra', muscleGroup: MuscleGroup.BACK },
    { name: 'Puxada Frontal', muscleGroup: MuscleGroup.BACK },
    { name: 'Desenvolvimento Ombro', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Elevação Lateral', muscleGroup: MuscleGroup.SHOULDERS },
    { name: 'Agachamento Livre', muscleGroup: MuscleGroup.LEGS },
    { name: 'Leg Press', muscleGroup: MuscleGroup.LEGS },
    { name: 'Rosca Direta Barra', muscleGroup: MuscleGroup.BICEPS },
    { name: 'Tríceps Pulley', muscleGroup: MuscleGroup.TRICEPS },
    { name: 'Abdominal Crunch', muscleGroup: MuscleGroup.CORE },
  ]

  const createdExercises: { [key: string]: string } = {}

  for (const ex of exercises) {
    const exercise = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: {
        ...ex,
        isGlobal: false,
        createdById: testUser.id,
      },
    })
    createdExercises[ex.name] = exercise.id
  }

  console.log(`✅ Created ${exercises.length} exercises`)

  // Função para obter data de uma semana específica (0 = atual, 1 = semana passada, etc.)
  // dayOfWeek: 0 = domingo, 1 = segunda, 2 = terça, etc.
  const getWeekDate = (weeksAgo: number, dayOfWeek: number = 1): Date => {
    const now = new Date()
    const date = new Date(now)
    
    // Calcular a segunda-feira da semana atual
    const currentDay = now.getDay()
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
    const mondayOfCurrentWeek = new Date(now)
    mondayOfCurrentWeek.setDate(now.getDate() - daysToMonday)
    mondayOfCurrentWeek.setHours(0, 0, 0, 0)
    
    // Subtrair semanas e adicionar o dia da semana
    const targetDate = new Date(mondayOfCurrentWeek)
    targetDate.setDate(mondayOfCurrentWeek.getDate() - (weeksAgo * 7) + (dayOfWeek - 1))
    
    // Adicionar hora aleatória entre 10h e 18h
    targetDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0)
    
    return targetDate
  }

  // Criar treinos distribuídos nas últimas 4 semanas
  // Semana 0 (atual): 2 treinos
  // Semana 1: 3 treinos
  // Semana 2: 2 treinos
  // Semana 3: 3 treinos

  const workoutSessions: Array<{
    title: string
    userId: string
    startAt: Date
    endAt: Date
    durationM: number
    fatigue: number
    feeling: Feeling
    notes: string
  }> = []

  // Semana 3 (mais antiga) - 3 treinos
  for (let i = 0; i < 3; i++) {
    const startAt = getWeekDate(3, i === 0 ? 1 : i === 1 ? 3 : 5) // Segunda, Quarta, Sexta
    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + 60 + Math.floor(Math.random() * 30))

    workoutSessions.push({
      title: ['Treino A', 'Treino B', 'Treino C'][i],
      userId: testUser.id,
      startAt,
      endAt,
      durationM: Math.floor((endAt.getTime() - startAt.getTime()) / 60000),
      fatigue: 3 + Math.floor(Math.random() * 5),
      feeling: [Feeling.GOOD, Feeling.GREAT, Feeling.OKAY][Math.floor(Math.random() * 3)],
      notes: `Treino da semana 3 - ${i + 1}`,
    })
  }

  // Semana 2 - 2 treinos
  for (let i = 0; i < 2; i++) {
    const startAt = getWeekDate(2, i === 0 ? 1 : 4) // Segunda e Quinta
    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + 60 + Math.floor(Math.random() * 30))

    workoutSessions.push({
      title: ['Treino Superior', 'Treino Inferior'][i],
      userId: testUser.id,
      startAt,
      endAt,
      durationM: Math.floor((endAt.getTime() - startAt.getTime()) / 60000),
      fatigue: 4 + Math.floor(Math.random() * 4),
      feeling: [Feeling.GOOD, Feeling.OKAY][Math.floor(Math.random() * 2)],
      notes: `Treino da semana 2 - ${i + 1}`,
    })
  }

  // Semana 1 - 3 treinos
  for (let i = 0; i < 3; i++) {
    const startAt = getWeekDate(1, i === 0 ? 1 : i === 1 ? 3 : 5) // Segunda, Quarta, Sexta
    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + 60 + Math.floor(Math.random() * 30))

    workoutSessions.push({
      title: ['Treino Peito', 'Treino Costas', 'Treino Pernas'][i],
      userId: testUser.id,
      startAt,
      endAt,
      durationM: Math.floor((endAt.getTime() - startAt.getTime()) / 60000),
      fatigue: 5 + Math.floor(Math.random() * 4),
      feeling: [Feeling.GOOD, Feeling.GREAT, Feeling.OKAY][Math.floor(Math.random() * 3)],
      notes: `Treino da semana 1 - ${i + 1}`,
    })
  }

  // Semana 0 (atual) - 2 treinos
  for (let i = 0; i < 2; i++) {
    const startAt = getWeekDate(0, i === 0 ? 1 : 3) // Segunda e Quarta
    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + 60 + Math.floor(Math.random() * 30))

    workoutSessions.push({
      title: `Treino ${i === 0 ? 'Peito e Tríceps' : 'Costas e Bíceps'}`,
      userId: testUser.id,
      startAt,
      endAt,
      durationM: Math.floor((endAt.getTime() - startAt.getTime()) / 60000),
      fatigue: 5 + Math.floor(Math.random() * 4),
      feeling: [Feeling.GOOD, Feeling.GREAT][Math.floor(Math.random() * 2)],
      notes: `Treino da semana atual ${i + 1}`,
    })
  }

  // Criar treinos com exercícios e sets progressivos para gerar PRs
  // Progressão: cargas aumentam ao longo das semanas (semana 3 -> semana 0)
  const exerciseProgressions: { [key: string]: number[] } = {
    'Supino Reto Barra': [60, 65, 70, 75, 80, 85, 90], // PR final: 90kg
    'Supino Inclinado Halter': [25, 27.5, 30, 32.5, 35, 37.5], // PR final: 37.5kg
    'Remada Curvada Barra': [50, 55, 60, 65, 70, 75], // PR final: 75kg
    'Puxada Frontal': [40, 45, 50, 55, 60], // PR final: 60kg
    'Desenvolvimento Ombro': [30, 32.5, 35, 37.5, 40], // PR final: 40kg
    'Agachamento Livre': [80, 85, 90, 95, 100, 105, 110], // PR final: 110kg
    'Leg Press': [100, 110, 120, 130, 140], // PR final: 140kg
    'Rosca Direta Barra': [20, 22.5, 25, 27.5, 30], // PR final: 30kg
    'Tríceps Pulley': [25, 27.5, 30, 32.5, 35], // PR final: 35kg
  }

  // Rastrear progressão por exercício
  const exerciseProgressionIndex: { [key: string]: number } = {}

  for (let sessionIndex = 0; sessionIndex < workoutSessions.length; sessionIndex++) {
    const sessionData = workoutSessions[sessionIndex]
    const session = await prisma.workoutSession.create({
      data: sessionData,
    })

    // Selecionar 3-5 exercícios aleatórios por treino
    // (todos os exercícios já têm muscleGroup definido e não são OTHER)
    const selectedExercises = exercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3))

    for (let exIndex = 0; exIndex < selectedExercises.length; exIndex++) {
      const exercise = selectedExercises[exIndex]
      const exerciseId = createdExercises[exercise.name]

      const sessionExercise = await prisma.sessionExercise.create({
        data: {
          sessionId: session.id,
          exerciseId,
          order: exIndex,
          notes: null,
        },
      })

      // Criar 3-4 sets por exercício
      const numSets = 3 + Math.floor(Math.random() * 2)
      const progression = exerciseProgressions[exercise.name] || [20, 25, 30]

      // Inicializar índice de progressão para este exercício se não existir
      if (!exerciseProgressionIndex[exercise.name]) {
        exerciseProgressionIndex[exercise.name] = 0
      }

      for (let setIndex = 0; setIndex < numSets; setIndex++) {
        // Usar progressão crescente ao longo das semanas
        // workoutSessions está em ordem: semana 3 (índice 0-2), semana 2 (3-4), semana 1 (5-7), semana 0 (8-9)
        let weekIndex: number
        if (sessionIndex < 3) weekIndex = 0 // Semana 3 (mais antiga)
        else if (sessionIndex < 5) weekIndex = 1 // Semana 2
        else if (sessionIndex < 8) weekIndex = 2 // Semana 1
        else weekIndex = 3 // Semana 0 (atual)
        
        // Progressão: semana 3 usa cargas menores, semana 0 usa cargas maiores
        const baseProgressionIndex = (3 - weekIndex) * 0.8 // Invertido: semana 3 = 0, semana 0 = 2.4
        const loadIndex = Math.min(
          Math.floor(baseProgressionIndex + exerciseProgressionIndex[exercise.name] + setIndex * 0.2),
          progression.length - 1
        )
        const load = progression[loadIndex]
        const reps = 8 + Math.floor(Math.random() * 4) // 8-11 reps
        const rir = 1 + Math.floor(Math.random() * 2) // 1-2 RIR

        await prisma.sessionSet.create({
          data: {
            sessionExId: sessionExercise.id,
            setIndex,
            plannedLoad: load,
            plannedReps: reps,
            plannedRir: rir,
            actualLoad: load + (Math.random() > 0.5 ? 2.5 : 0), // Às vezes aumenta um pouco
            actualReps: reps + (Math.random() > 0.7 ? 1 : 0), // Às vezes faz mais uma rep
            actualRir: rir,
            unit: EffortUnit.KG,
            completed: Math.random() > 0.1, // 90% completados
            notes: null,
          },
        })
      }

      // Incrementar índice de progressão para este exercício
      exerciseProgressionIndex[exercise.name] += 0.5
    }
  }

  console.log(`✅ Created ${workoutSessions.length} workout sessions with exercises and sets`)

  // Criar alguns PRs recentes (últimos 30 dias) para testar a funcionalidade
  const recentDate = new Date()
  recentDate.setDate(recentDate.getDate() - 5) // 5 dias atrás

  const prSession = await prisma.workoutSession.create({
    data: {
      title: 'Treino PR',
      userId: testUser.id,
      startAt: recentDate,
      endAt: new Date(recentDate.getTime() + 60 * 60 * 1000),
      durationM: 60,
      fatigue: 6,
      feeling: Feeling.GREAT,
      notes: 'Treino com novos PRs!',
    },
  })

  // Criar PRs para alguns exercícios
  const prExercises = [
    { name: 'Supino Reto Barra', load: 95 }, // Novo PR (anterior era 90)
    { name: 'Agachamento Livre', load: 115 }, // Novo PR (anterior era 110)
    { name: 'Remada Curvada Barra', load: 80 }, // Novo PR (anterior era 75)
  ]

  for (let i = 0; i < prExercises.length; i++) {
    const prEx = prExercises[i]
    const exerciseId = createdExercises[prEx.name]

    const sessionExercise = await prisma.sessionExercise.create({
      data: {
        sessionId: prSession.id,
        exerciseId,
        order: i,
      },
    })

    // Criar 3 sets com o novo PR
    for (let setIndex = 0; setIndex < 3; setIndex++) {
      await prisma.sessionSet.create({
        data: {
          sessionExId: sessionExercise.id,
          setIndex,
          plannedLoad: prEx.load,
          plannedReps: 8,
          actualLoad: prEx.load,
          actualReps: 8 + (setIndex === 0 ? 1 : 0), // Primeiro set com 1 rep a mais
          unit: EffortUnit.KG,
          completed: true,
        },
      })
    }
  }

  console.log(`✅ Created PR session with ${prExercises.length} new PRs`)

  console.log('\n🎉 Evolution seed completed!')
  console.log(`\n📊 Summary:`)
  console.log(`   - User: ${testUser.email}`)
  console.log(`   - Exercises: ${exercises.length}`)
  console.log(`   - Workout Sessions: ${workoutSessions.length + 1}`)
  console.log(`   - PRs created: ${prExercises.length}`)
  console.log(`\n🔑 Login credentials:`)
  console.log(`   Email: ${testUser.email}`)
  console.log(`   Password: test123`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Error seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

