import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting measurements seed...')

  // Buscar usuário de teste (mesmo do seed-evolution)
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@evolution.com' },
  })

  if (!testUser) {
    console.log('❌ Test user not found. Please run seed-evolution.ts first.')
    return
  }

  console.log(`✅ User found: ${testUser.email}`)

  // Limpar medidas existentes do usuário (opcional - comentar se quiser manter)
  await prisma.bodyMeasurement.deleteMany({
    where: { userId: testUser.id },
  })
  console.log('🧹 Cleared existing measurements')

  // Função para obter data de uma semana específica
  const getWeekDate = (weeksAgo: number, dayOfWeek: number = 1): Date => {
    // dayOfWeek: 0 = domingo, 1 = segunda, 2 = terça, etc.
    const date = new Date()
    date.setDate(date.getDate() - (weeksAgo * 7))
    
    // Ajustar para o dia da semana desejado
    const currentDay = date.getDay()
    const diff = dayOfWeek - currentDay
    date.setDate(date.getDate() + diff)
    
    // Normalizar para início do dia
    date.setHours(0, 0, 0, 0)
    return date
  }

  // Valores iniciais (8 semanas atrás)
  const initialWeight = 75.0 // kg
  const initialWaist = 85.0 // cm
  const initialArm = 32.0 // cm

  // Taxa de ganho semanal (0.5% por semana)
  const weeklyWeightGainPercent = 0.005
  const weeklyWaistChange = 0.1 // cm (pode aumentar ou diminuir)
  const weeklyArmGain = 0.15 // cm

  const measurements: Array<{
    userId: string
    date: Date
    weight: number
    waist: number
    arm: number
    notes: string | null
  }> = []

  // Gerar medidas para as últimas 8 semanas
  // Cada semana terá 2-3 medidas em dias diferentes
  for (let week = 8; week >= 0; week--) {
    const weekStart = getWeekDate(week, 1) // Segunda-feira
    
    // Determinar quantas medidas nesta semana (2-3)
    const measuresPerWeek = week === 0 ? 1 : Math.floor(Math.random() * 2) + 2 // 2-3 medidas, exceto semana atual (1)
    
    for (let i = 0; i < measuresPerWeek; i++) {
      // Distribuir medidas ao longo da semana (segunda, quarta, sexta ou terça, quinta)
      const dayOffset = i === 0 ? 0 : i === 1 ? 2 : 4 // Segunda, Quarta, Sexta
      const measurementDate = new Date(weekStart)
      measurementDate.setDate(measurementDate.getDate() + dayOffset)
      
      // Não criar medidas futuras
      if (measurementDate > new Date()) {
        continue
      }

      // Calcular valores progressivos
      const weeksFromStart = 8 - week
      const weight = initialWeight * (1 + weeklyWeightGainPercent * weeksFromStart) + (Math.random() * 0.3 - 0.15) // Variação de ±0.15kg
      const waist = initialWaist + (weeklyWaistChange * weeksFromStart) + (Math.random() * 0.5 - 0.25) // Variação de ±0.25cm
      const arm = initialArm + (weeklyArmGain * weeksFromStart) + (Math.random() * 0.2 - 0.1) // Variação de ±0.1cm

      // Adicionar algumas notas ocasionais
      const notes = Math.random() > 0.7 ? 
        (weeksFromStart % 3 === 0 ? 'Medição após treino de pernas' : 
         weeksFromStart % 4 === 0 ? 'Medição matinal' : 
         'Medição padrão') : null

      measurements.push({
        userId: testUser.id,
        date: measurementDate,
        weight: Math.round(weight * 10) / 10, // 1 decimal
        waist: Math.round(waist * 10) / 10,
        arm: Math.round(arm * 10) / 10,
        notes,
      })
    }
  }

  // Ordenar por data (mais antiga primeiro)
  measurements.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Criar medidas no banco
  console.log(`📊 Creating ${measurements.length} measurements...`)
  
  for (const measurement of measurements) {
    await prisma.bodyMeasurement.create({
      data: measurement,
    })
  }

  console.log('✅ Measurements created successfully!')
  console.log(`   - Total measurements: ${measurements.length}`)
  console.log(`   - Date range: ${measurements[0].date.toLocaleDateString()} to ${measurements[measurements.length - 1].date.toLocaleDateString()}`)
  console.log(`   - Weight range: ${Math.min(...measurements.map(m => m.weight)).toFixed(1)}kg to ${Math.max(...measurements.map(m => m.weight)).toFixed(1)}kg`)
  console.log(`   - User: ${testUser.email}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding measurements:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

