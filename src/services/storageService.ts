import { writeFile, readFile, mkdir, access } from 'fs/promises'
import { join } from 'path'

interface StoredSpecification {
  id: string
  markdown: string
  timestamp: string
  version: number
}

class StorageService {
  // In-memory storage for server-side (fallback)
  private serverStorage: Map<string, StoredSpecification> = new Map()
  private storageDir: string

  constructor() {
    // Use a persistent directory for server-side storage
    this.storageDir = join(process.cwd(), 'storage', 'specifications')
    this.ensureStorageDir()
  }

  // Ensure storage directory exists
  private async ensureStorageDir() {
    if (typeof window === 'undefined') {
      try {
        await access(this.storageDir)
      } catch {
        await mkdir(this.storageDir, { recursive: true })
      }
    }
  }

  // Get file path for a specification
  private getFilePath(id: string): string {
    return join(this.storageDir, `${id}.json`)
  }

  async storeSpecification(spec: StoredSpecification): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: store in both memory and file system
      this.serverStorage.set(spec.id, spec)
      try {
        await this.ensureStorageDir()
        await writeFile(this.getFilePath(spec.id), JSON.stringify(spec, null, 2))
      } catch (error) {
        console.warn('Failed to store specification to file:', error)
        // Continue with memory storage as fallback
      }
    } else {
      // Client-side: use localStorage
      localStorage.setItem(`specification_${spec.id}`, JSON.stringify(spec))
      
      // Update specification list for easy retrieval
      const existingList = localStorage.getItem('specification_list')
      const specList = existingList ? JSON.parse(existingList) : []
      
      // Check if spec already exists in list
      const existingIndex = specList.findIndex((s: any) => s.id === spec.id)
      const specSummary = {
        id: spec.id,
        timestamp: spec.timestamp,
        version: spec.version
      }
      
      if (existingIndex >= 0) {
        specList[existingIndex] = specSummary
      } else {
        specList.push(specSummary)
      }
      
      localStorage.setItem('specification_list', JSON.stringify(specList))
    }
  }

  async getSpecification(id: string): Promise<StoredSpecification | null> {
    if (typeof window === 'undefined') {
      // Server-side: try file system first, then memory
      try {
        const fileContent = await readFile(this.getFilePath(id), 'utf-8')
        const spec = JSON.parse(fileContent)
        // Also cache in memory for faster access
        this.serverStorage.set(id, spec)
        return spec
      } catch (error) {
        // Fallback to memory storage
        return this.serverStorage.get(id) || null
      }
    } else {
      // Client-side: use localStorage
      const stored = localStorage.getItem(`specification_${id}`)
      return stored ? JSON.parse(stored) : null
    }
  }

  async getAllSpecifications(): Promise<StoredSpecification[]> {
    if (typeof window === 'undefined') {
      // Server-side: try to read all files
      try {
        await this.ensureStorageDir()
        const { readdir } = await import('fs/promises')
        const files = await readdir(this.storageDir)
        const jsonFiles = files.filter(f => f.endsWith('.json'))
        
        const specifications: StoredSpecification[] = []
        for (const file of jsonFiles) {
          try {
            const content = await readFile(join(this.storageDir, file), 'utf-8')
            const spec = JSON.parse(content)
            specifications.push(spec)
            // Cache in memory
            this.serverStorage.set(spec.id, spec)
          } catch (error) {
            console.warn(`Failed to read specification file ${file}:`, error)
          }
        }
        
        return specifications
      } catch (error) {
        // Fallback to memory storage
        return Array.from(this.serverStorage.values())
      }
    } else {
      // Client-side: get from localStorage list
      const list = localStorage.getItem('specification_list')
      if (!list) return []
      
      const specList = JSON.parse(list)
      const specifications: StoredSpecification[] = []
      
      for (const summary of specList) {
        const spec = await this.getSpecification(summary.id)
        if (spec) {
          specifications.push(spec)
        }
      }
      
      return specifications
    }
  }

  async deleteSpecification(id: string): Promise<boolean> {
    if (typeof window === 'undefined') {
      // Server-side: delete from both memory and file system
      const memoryDeleted = this.serverStorage.delete(id)
      try {
        const { unlink } = await import('fs/promises')
        await unlink(this.getFilePath(id))
      } catch (error) {
        console.warn('Failed to delete specification file:', error)
      }
      return memoryDeleted
    } else {
      // Client-side: delete from localStorage
      localStorage.removeItem(`specification_${id}`)
      
      // Also remove from list
      const existingList = localStorage.getItem('specification_list')
      if (existingList) {
        const specList = JSON.parse(existingList)
        const filteredList = specList.filter((s: any) => s.id !== id)
        localStorage.setItem('specification_list', JSON.stringify(filteredList))
      }
      
      return true
    }
  }

  // Clear all stored specifications (useful for development/testing)
  async clearAll(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: clear memory and delete all files
      this.serverStorage.clear()
      try {
        const { readdir, unlink } = await import('fs/promises')
        const files = await readdir(this.storageDir)
        const jsonFiles = files.filter(f => f.endsWith('.json'))
        
        for (const file of jsonFiles) {
          await unlink(join(this.storageDir, file))
        }
      } catch (error) {
        console.warn('Failed to clear specification files:', error)
      }
    } else {
      // Client-side: clear localStorage
      const list = localStorage.getItem('specification_list')
      if (list) {
        const specList = JSON.parse(list)
        for (const summary of specList) {
          localStorage.removeItem(`specification_${summary.id}`)
        }
      }
      localStorage.removeItem('specification_list')
    }
  }
}

export const storageService = new StorageService()
export type { StoredSpecification } 