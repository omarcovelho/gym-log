import html2canvas from 'html2canvas'

export async function generateWorkoutImage(): Promise<Blob> {
  const element = document.getElementById('workout-export-view')
  if (!element) {
    throw new Error('Export view element not found')
  }

  const canvas = await html2canvas(element, {
    width: 1080,
    height: 1920,
    scale: 1,
    backgroundColor: '#0f0f0f',
    useCORS: true,
    logging: false,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to generate image blob'))
        }
      },
      'image/png',
      1.0
    )
  })
}

export async function downloadWorkoutImage(blob: Blob, filename: string = 'workout.png') {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function shareWorkoutImage(blob: Blob): Promise<boolean> {
  if (!navigator.share) {
    return false
  }

  try {
    const file = new File([blob], 'workout.png', { type: 'image/png' })
    await navigator.share({
      title: 'My Workout',
      files: [file],
    })
    return true
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Error sharing:', error)
    }
    return false
  }
}

