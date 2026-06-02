import { Response } from 'express'

type Client = {
  userId: number
  response: Response
}

const clients: Client[] = []

// =========================
// CONNECTION MANAGEMENT
// =========================

export const addClient = (userId: number, response: Response) => {
  clients.push({ userId, response })
}

export const removeClient = (response: Response) => {
  const index = clients.findIndex((c) => c.response === response)

  if (index !== -1) {
    clients.splice(index, 1)
  }
}

export const getConnectedClients = () => {
  return clients.length
}

// =========================
// SSE SEND FUNCTIONS
// =========================

export const sendToUser = (userId: number, event: string, data: unknown) => {
  const userClients = clients.filter((c) => c.userId === userId)

  userClients.forEach((client) => {
    client.response.write(`
event: ${event}
data: ${JSON.stringify(data)}

`)
  })
}

export const broadcast = (event: string, data: unknown) => {
  clients.forEach((client) => {
    client.response.write(`
event: ${event}
data: ${JSON.stringify(data)}

`)
  })
}

// =========================
// KEEP ALIVE (heartbeat)
// =========================

setInterval(() => {
  broadcast('heartbeat', {
    timestamp: Date.now(),
  })
}, 30000)
