export interface Center {
  _id: string
  name: string
  description: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  capacity: {
    hotDesks: {
      total: number
      available: number
    }
    dedicatedDesks: {
      total: number
      available: number
    }
    privateCabins: {
      total: number
      available: number
    }
    meetingRooms: {
      total: number
      available: number
    }
  }
  amenities: string[]
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}