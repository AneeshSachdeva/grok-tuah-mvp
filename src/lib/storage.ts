import { Grok } from './types'

const STORAGE_KEY = 'grok_data'

export function getGrok(id: string): Grok | null {
  const storedData = localStorage.getItem(STORAGE_KEY)
  if (!storedData) return null

  const groks: Record<string, Grok> = JSON.parse(storedData)
  return groks[id] || null
}

export function getAllGroks(): Grok[] {
  const storedData = localStorage.getItem(STORAGE_KEY)
  if (!storedData) return []

  const groks: Record<string, Grok> = JSON.parse(storedData)
  return Object.values(groks)
}

export function createGrok(grok: Grok): void {
  const storedData = localStorage.getItem(STORAGE_KEY)
  const groks: Record<string, Grok> = storedData ? JSON.parse(storedData) : {}
  
  groks[grok.id] = grok
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groks))
}

export function updateGrok(id: string, updatedGrok: Grok): void {
  const storedData = localStorage.getItem(STORAGE_KEY)
  if (!storedData) return

  const groks: Record<string, Grok> = JSON.parse(storedData)
  groks[id] = updatedGrok
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groks))
}

export function getRootGroks(): Grok[] {
  const allGroks = getAllGroks()
  return allGroks.filter(grok => !grok.parentGrokId)
}

export function getChildGroks(parentId: string): Grok[] {
  const allGroks = getAllGroks()
  return allGroks.filter(grok => grok.parentGrokId === parentId)
}