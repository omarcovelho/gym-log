import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PRIMARY_COLOR = '#00E676'
const BACKGROUND_COLOR = '#0f0f0f'

// Função para criar ícone com design de haltere/peso
async function createIcon(size) {
  const padding = size * 0.15
  const centerX = size / 2
  const centerY = size / 2
  const barWidth = size * 0.5
  const weightWidth = size * 0.18
  const weightHeight = size * 0.32
  const barThickness = size * 0.06
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}" rx="${size * 0.2}"/>
      <g transform="translate(${centerX}, ${centerY})">
        <!-- Haltere estilizado -->
        <g stroke="${PRIMARY_COLOR}" stroke-width="${barThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <!-- Barra central -->
          <line x1="${-barWidth/2 + weightWidth/2}" y1="0" x2="${barWidth/2 - weightWidth/2}" y2="0"/>
          <!-- Peso esquerdo -->
          <rect x="${-barWidth/2 - weightWidth/2}" y="${-weightHeight/2}" width="${weightWidth}" height="${weightHeight}" rx="${size * 0.03}" fill="${PRIMARY_COLOR}" opacity="0.2" stroke="${PRIMARY_COLOR}"/>
          <rect x="${-barWidth/2 - weightWidth/2 + weightWidth * 0.15}" y="${-weightHeight/2 + weightHeight * 0.15}" width="${weightWidth * 0.7}" height="${weightHeight * 0.7}" rx="${size * 0.02}" fill="${PRIMARY_COLOR}"/>
          <!-- Peso direito -->
          <rect x="${barWidth/2 - weightWidth/2}" y="${-weightHeight/2}" width="${weightWidth}" height="${weightHeight}" rx="${size * 0.03}" fill="${PRIMARY_COLOR}" opacity="0.2" stroke="${PRIMARY_COLOR}"/>
          <rect x="${barWidth/2 - weightWidth/2 + weightWidth * 0.15}" y="${-weightHeight/2 + weightHeight * 0.15}" width="${weightWidth * 0.7}" height="${weightHeight * 0.7}" rx="${size * 0.02}" fill="${PRIMARY_COLOR}"/>
        </g>
      </g>
    </svg>
  `

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer()
}

// Gerar ícones
async function generateIcons() {
  console.log('Generating PWA icons...')
  
  try {
    const sizes = [192, 512]
    
    for (const size of sizes) {
      const icon = await createIcon(size)
      const outputPath = join(__dirname, '..', 'public', `icon-${size}x${size}.png`)
      writeFileSync(outputPath, icon)
      console.log(`✓ Created icon-${size}x${size}.png`)
    }
    
    console.log('✅ All icons generated successfully!')
  } catch (error) {
    console.error('❌ Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()

