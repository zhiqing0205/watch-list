// Server-only OSS client - only import on server side
let ossClient: any = null

async function getOSSClient() {
  if (typeof window !== 'undefined') {
    throw new Error('OSS client can only be used on the server side')
  }

  if (!ossClient) {
    try {
      const OSS = (await import('ali-oss')).default
      const OSS_REGION = process.env.OSS_REGION
      const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID  
      const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET
      const OSS_BUCKET_NAME = process.env.OSS_BUCKET_NAME

      if (!OSS_REGION || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET_NAME) {
        throw new Error('OSS environment variables are not set')
      }

      ossClient = new OSS({
        region: OSS_REGION,
        accessKeyId: OSS_ACCESS_KEY_ID,
        accessKeySecret: OSS_ACCESS_KEY_SECRET,
        bucket: OSS_BUCKET_NAME,
      })
    } catch (error) {
      console.error('Failed to initialize OSS client:', error)
      throw error
    }
  }
  return ossClient
}

export async function uploadFile(file: File, path: string): Promise<string> {
  const client = await getOSSClient()
  const result = await client.put(path, file)
  return result.url
}

export async function uploadBuffer(buffer: Buffer, path: string, contentType?: string): Promise<string> {
  const client = await getOSSClient()
  const options = contentType ? { headers: { 'Content-Type': contentType } } : {}
  const result = await client.put(path, buffer, options)
  return result.url
}

export async function uploadFromUrl(url: string, path: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    return await uploadBuffer(buffer, path, contentType)
  } catch (error) {
    console.error('Error uploading from URL:', error)
    throw error
  }
}

export async function deleteFile(path: string): Promise<void> {
  const client = await getOSSClient()
  await client.delete(path)
}

export function generateFilePath(type: 'movie' | 'tv' | 'actor', id: string, filename: string): string {
  const extension = filename.split('.').pop() || 'jpg'
  return `${type}/${id}.${extension}`
}

export function generateTMDbImagePath(type: 'movie' | 'tv' | 'actor', tmdbId: number, imagePath: string): string {
  const extension = imagePath.split('.').pop() || 'jpg'
  return `${type}/${tmdbId}.${extension}`
}

export async function uploadTMDbImage(
  tmdbImagePath: string,
  type: 'movie' | 'tv' | 'actor',
  tmdbId: number
): Promise<string> {
  if (!tmdbImagePath) {
    throw new Error('No image path provided')
  }

  const imageUrl = `https://image.tmdb.org/t/p/w500${tmdbImagePath}`
  const ossPath = generateTMDbImagePath(type, tmdbId, tmdbImagePath)
  
  try {
    return await uploadFromUrl(imageUrl, ossPath)
  } catch (error) {
    console.error('Error uploading TMDb image:', error)
    throw error
  }
}