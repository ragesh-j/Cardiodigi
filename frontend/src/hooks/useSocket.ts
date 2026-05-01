import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const useSocket = (doctorId: string) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!doctorId) return

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000')
    socketRef.current.emit('join:doctor', doctorId)

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [doctorId])

  return socketRef.current
}

export default useSocket