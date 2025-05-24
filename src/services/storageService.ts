interface StoredSpecification {
  id: string
  markdown: string
  timestamp: string
  version: number
}

class StorageService {
  // In-memory storage for server-side
  private serverStorage = new Map<string, StoredSpecification>()

  async storeSpecification(spec: StoredSpecification): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: use in-memory storage
      this.serverStorage.set(spec.id, spec)
      console.log(`Stored specification ${spec.id} in server memory`)
    } else {
      // Client-side: use localStorage
      localStorage.setItem(`specification_${spec.id}`, JSON.stringify(spec))
      
      // Also store in a list for easy retrieval
      const existingList = localStorage.getItem('specification_list')
      const specList = existingList ? JSON.parse(existingList) : []
      
      // Update or add specification
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
      // Server-side: use in-memory storage
      return this.serverStorage.get(id) || null
    } else {
      // Client-side: use localStorage
      const stored = localStorage.getItem(`specification_${id}`)
      return stored ? JSON.parse(stored) : null
    }
  }

  async getAllSpecifications(): Promise<StoredSpecification[]> {
    if (typeof window === 'undefined') {
      // Server-side: return all from memory
      return Array.from(this.serverStorage.values())
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
      // Server-side: delete from memory
      return this.serverStorage.delete(id)
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
}

export const storageService = new StorageService()
export type { StoredSpecification } 