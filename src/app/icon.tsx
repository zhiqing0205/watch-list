import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          borderRadius: '6px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        剧
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  )
}