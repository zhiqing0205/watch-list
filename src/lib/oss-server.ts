// Server-only OSS client - only import on server side
let ossClient: any = null

async function getOSSClient() {
  if (typeof window !== 'undefined') {
    throw new Error('OSS client can only be used on the server side')
  }

  if (!ossClient) {
    try {
      console.log('Initializing OSS client...')
      const OSS = (await import('ali-oss')).default
      const OSS_REGION = process.env.OSS_REGION
      const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID  
      const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET
      const OSS_BUCKET_NAME = process.env.OSS_BUCKET_NAME

      console.log('OSS Config:', {
        OSS_REGION,
        OSS_BUCKET_NAME,
        OSS_ACCESS_KEY_ID: OSS_ACCESS_KEY_ID ? `${OSS_ACCESS_KEY_ID.substring(0, 8)}...` : undefined,
        OSS_ACCESS_KEY_SECRET: OSS_ACCESS_KEY_SECRET ? '***' : undefined
      })

      if (!OSS_REGION || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET_NAME) {
        throw new Error('OSS environment variables are not set')
      }

      ossClient = new OSS({
        region: OSS_REGION,
        accessKeyId: OSS_ACCESS_KEY_ID,
        accessKeySecret: OSS_ACCESS_KEY_SECRET,
        bucket: OSS_BUCKET_NAME,
      })
      
      console.log('OSS client initialized successfully')
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
  // 确保返回的URL使用HTTPS协议
  return result.url.replace(/^http:/, 'https:')
}

export async function uploadBuffer(buffer: Buffer, path: string, contentType?: string): Promise<string> {
  console.log(`Starting buffer upload to path: ${path}, size: ${buffer.length} bytes, content-type: ${contentType}`)
  
  const client = await getOSSClient()
  const options = contentType ? { headers: { 'Content-Type': contentType } } : {}
  
  console.log(`Uploading to OSS with options:`, options)
  
  try {
    const result = await client.put(path, buffer, options)
    console.log(`OSS upload successful, original URL: ${result.url}`)
    
    // 确保返回的URL使用HTTPS协议
    const httpsUrl = result.url.replace(/^http:/, 'https:')
    console.log(`Final HTTPS URL: ${httpsUrl}`)
    
    return httpsUrl
  } catch (error) {
    console.error('OSS upload failed:', error)
    throw error
  }
}

export async function uploadFromUrl(url: string, path: string): Promise<string> {
  console.log(`Starting upload from URL: ${url} to path: ${path}`)
  
  try {
    console.log(`Fetching image from: ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    console.log(`Image fetched successfully, size: ${buffer.length} bytes, content-type: ${contentType}`)
    
    const result = await uploadBuffer(buffer, path, contentType)
    console.log(`Upload completed successfully, result: ${result}`)
    
    return result
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
    const url = await uploadFromUrl(imageUrl, ossPath)
    // 确保返回的URL使用HTTPS协议
    return url.replace(/^http:/, 'https:')
  } catch (error) {
    console.error('Error uploading TMDb image:', error)
    throw error
  }
}