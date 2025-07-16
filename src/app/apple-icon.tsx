import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export default function AppleTouchIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          borderRadius: '32px',
          color: 'white',
          fontSize: '100px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        剧
      </div>
    ),
    {
      width: 180,
      height: 180,
    }
  )
}