import { redis } from "./redis"


export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key)

    if (!data) return null

    return JSON.parse(data)
  } catch (error) {
    console.error('Redis GET Error:', error)
    return null
  }
}

export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds = 300
) => {
  try {
    await redis.set(
      key,
      JSON.stringify(value),
      'EX',
      ttlSeconds
    )
  } catch (error) {
    console.error('Redis SET Error:', error)
  }
}

export const deleteCache = async (key: string) => {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis DELETE Error:', error)
  }
}