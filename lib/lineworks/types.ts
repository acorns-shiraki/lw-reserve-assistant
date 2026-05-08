export interface CalendarEventsResponse {
  events: EventComponents[]
}

export interface EventComponents {
  eventComponents: CalendarEvent[]
  organizerCalendarId: string
}

export interface CalendarEvent {
  eventId: string
  summary: string
  description?: string
  start: EventDateTime
  end: EventDateTime
  recurrence?: string[]
  recurringEventId?: string
  transparency?: 'OPAQUE' | 'TRANSPARENT'
  visibility?: 'PUBLIC' | 'PRIVATE'
  attendees?: Attendee[]
}

export interface EventDateTime {
  date?: string
  dateTime?: string
  timeZone?: string
}

export interface Attendee {
  email?: string
  displayName?: string
  partstat?: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE'
  isResource?: boolean
  isOptional?: boolean
}

export interface UserProfile {
  domainId: number
  userId: string
  email: string
  userName: {
    lastName?: string | null
    firstName?: string | null
  }
}
