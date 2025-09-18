# Event Center Backend Integration Guide

## Overview
Complete backend implementation for EventCenter.tsx supporting comprehensive event and meeting management with recurring events, attendee tracking, calendar views, and reminder systems. This module handles the complete event lifecycle from creation to completion.

## Table of Contents
1. [Database Schema & Migrations](#database-schema--migrations)
2. [Express Routes & Controllers](#express-routes--controllers)
3. [Services & Data Layer](#services--data-layer)
4. [Recurring Events & Calendar](#recurring-events--calendar)
5. [Reminder System](#reminder-system)
6. [Frontend Integration](#frontend-integration)
7. [Implementation Plan](#implementation-plan)

---

## Database Schema & Migrations

### Complete Migration SQL

```sql
-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'tentative', 'cancelled')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendees JSONB DEFAULT '[]', -- Array of user IDs
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  reminder_setting VARCHAR(50), -- 'none', '15min', '1hour', '1day', '1week'
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Categories Table
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  icon VARCHAR(50), -- Icon identifier
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Attendees Table
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  attendance_status VARCHAR(20) DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'accepted', 'declined', 'tentative')),
  response_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Event Recurrence Table
CREATE TABLE event_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_value INTEGER NOT NULL DEFAULT 1, -- Every X days/weeks/months/years
  days_of_week INTEGER[] DEFAULT '{}', -- [1,2,3,4,5] for weekdays
  day_of_month INTEGER, -- For monthly recurrence
  end_date DATE, -- When recurrence ends
  max_occurrences INTEGER, -- Maximum number of occurrences
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Reminders Table
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push', 'in_app')),
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_recurring ON events(is_recurring);
CREATE INDEX idx_events_date_range ON events(start_date, end_date);
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX idx_event_recurrence_event ON event_recurrence(event_id);
CREATE INDEX idx_event_reminders_time ON event_reminders(reminder_time, is_sent);
CREATE INDEX idx_event_categories_active ON event_categories(is_active);

-- Full-text search index
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### Recurring Events Functions

```sql
-- Function to generate recurring event occurrences
CREATE OR REPLACE FUNCTION generate_recurring_occurrences(
  p_event_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  occurrence_date DATE,
  occurrence_id UUID
) AS $$
DECLARE
  event_record RECORD;
  recurrence_record RECORD;
  current_date DATE;
  occurrence_count INTEGER := 0;
  max_occurrences INTEGER;
BEGIN
  -- Get event details
  SELECT * INTO event_record FROM events WHERE id = p_event_id;
  
  -- Get recurrence pattern
  SELECT * INTO recurrence_record FROM event_recurrence 
  WHERE event_id = p_event_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN; -- No recurrence pattern
  END IF;
  
  max_occurrences := COALESCE(recurrence_record.max_occurrences, 999);
  current_date := p_start_date;
  
  WHILE current_date <= p_end_date AND occurrence_count < max_occurrences LOOP
    -- Check if this date matches the recurrence pattern
    IF matches_recurrence_pattern(current_date, recurrence_record) THEN
      occurrence_count := occurrence_count + 1;
      occurrence_date := current_date;
      occurrence_id := gen_random_uuid();
      RETURN NEXT;
    END IF;
    
    -- Move to next potential occurrence
    CASE recurrence_record.recurrence_type
      WHEN 'daily' THEN
        current_date := current_date + (recurrence_record.interval_value || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        current_date := current_date + (recurrence_record.interval_value || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        current_date := current_date + (recurrence_record.interval_value || ' months')::INTERVAL;
      WHEN 'yearly' THEN
        current_date := current_date + (recurrence_record.interval_value || ' years')::INTERVAL;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if a date matches recurrence pattern
CREATE OR REPLACE FUNCTION matches_recurrence_pattern(
  check_date DATE,
  recurrence RECORD
)
RETURNS BOOLEAN AS $$
BEGIN
  CASE recurrence.recurrence_type
    WHEN 'daily' THEN
      RETURN true; -- Daily always matches
    WHEN 'weekly' THEN
      RETURN EXTRACT(dow FROM check_date) = ANY(recurrence.days_of_week);
    WHEN 'monthly' THEN
      RETURN EXTRACT(day FROM check_date) = recurrence.day_of_month;
    WHEN 'yearly' THEN
      RETURN EXTRACT(month FROM check_date) = EXTRACT(month FROM recurrence.event_id::text::date)
        AND EXTRACT(day FROM check_date) = EXTRACT(day FROM recurrence.event_id::text::date);
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

---

## Express Routes & Controllers

### Route File: `backend/src/routes/events.routes.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles, hasPermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import * as eventsController from '../controllers/events.controller';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Core Event Management
router.get('/events', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.listEvents)
);

router.post('/events', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.create'),
  asyncHandler(eventsController.createEvent)
);

router.get('/events/:id', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.getEvent)
);

router.put('/events/:id', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.updateEvent)
);

router.delete('/events/:id', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('events.delete'),
  asyncHandler(eventsController.deleteEvent)
);

// Event Filtering & Search
router.get('/events/upcoming', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.getUpcomingEvents)
);

router.get('/events/past', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.getPastEvents)
);

router.get('/events/search', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.searchEvents)
);

// Event Categories
router.get('/events/categories', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.listCategories)
);

router.post('/events/categories', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('events.create'),
  asyncHandler(eventsController.createCategory)
);

router.put('/events/categories/:id', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('events.update'),
  asyncHandler(eventsController.updateCategory)
);

router.delete('/events/categories/:id', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('events.delete'),
  asyncHandler(eventsController.deleteCategory)
);

// Event Attendees
router.get('/events/:id/attendees', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.getEventAttendees)
);

router.post('/events/:id/attendees', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.addAttendee)
);

router.put('/events/:id/attendees/:userId', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.updateAttendance)
);

router.delete('/events/:id/attendees/:userId', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.removeAttendee)
);

// Event Status & Priority
router.put('/events/:id/status', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.updateEventStatus)
);

router.put('/events/:id/priority', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.updateEventPriority)
);

router.post('/events/:id/cancel', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.cancelEvent)
);

router.post('/events/:id/reschedule', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.rescheduleEvent)
);

// Calendar Integration
router.get('/events/calendar', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.getCalendarMonth)
);

router.get('/events/calendar/week', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.getCalendarWeek)
);

router.get('/events/calendar/day', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.read'),
  asyncHandler(eventsController.getCalendarDay)
);

// Recurring Events
router.post('/events/:id/recurring', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.create'),
  asyncHandler(eventsController.createRecurringEvent)
);

router.put('/events/:id/recurring', 
  requireRoles(['super_admin', 'hr_admin', 'event_manager']),
  hasPermission('events.update'),
  asyncHandler(eventsController.updateRecurringEvent)
);

router.delete('/events/:id/recurring', 
  requireRoles(['super_admin', 'hr_admin']),
  hasPermission('events.delete'),
  asyncHandler(eventsController.deleteRecurringEvent)
);

export default router;
```

### Controller: `backend/src/controllers/events.controller.ts`

```typescript
import { Request, Response } from 'express';
import { EventsService } from '../services/events.service';
import { validateEventInput } from '../validators/event.validator';
import { AuditService } from '../services/audit.service';

export const listEvents = async (req: Request, res: Response) => {
  const {
    status,
    category,
    priority,
    date_from,
    date_to,
    search,
    organizer,
    attendee,
    recurring,
    page = 1,
    limit = 25,
    sort_by = 'start_date',
    sort_order = 'asc'
  } = req.query;

  const filters = {
    status: status as string,
    category: category as string,
    priority: priority as string,
    date_from: date_from as string,
    date_to: date_to as string,
    search: search as string,
    organizer: organizer as string,
    attendee: attendee as string,
    recurring: recurring as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort_by: sort_by as string,
    sort_order: sort_order as 'asc' | 'desc'
  };

  const result = await EventsService.list(filters);
  
  res.json({
    success: true,
    data: {
      events: result.events,
      categories: result.categories,
      pagination: result.pagination,
      filters: result.filters
    }
  });
};

export const createEvent = async (req: Request, res: Response) => {
  const validationResult = validateEventInput(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const event = await EventsService.create(req.body, userId);
  
  // Audit log
  await AuditService.log({
    userId,
    action: 'event_created',
    resource: 'events',
    resourceId: event.id,
    details: { 
      title: event.title,
      start_date: event.start_date,
      category_id: event.category_id
    }
  });

  res.status(201).json({
    success: true,
    data: event
  });
};

export const getEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const event = await EventsService.getById(id);
  
  res.json({
    success: true,
    data: event
  });
};

export const updateEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validationResult = validateEventInput(req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.errors
    });
  }

  const userId = req.user.id;
  const event = await EventsService.update(id, req.body, userId);
  
  await AuditService.log({
    userId,
    action: 'event_updated',
    resource: 'events',
    resourceId: id,
    details: req.body
  });

  res.json({
    success: true,
    data: event
  });
};

export const deleteEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  await EventsService.delete(id, userId);
  
  await AuditService.log({
    userId,
    action: 'event_deleted',
    resource: 'events',
    resourceId: id,
    details: {}
  });

  res.json({
    success: true,
    message: 'Event deleted successfully'
  });
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  
  const events = await EventsService.getUpcoming(parseInt(limit as string));
  
  res.json({
    success: true,
    data: events
  });
};

export const getCalendarMonth = async (req: Request, res: Response) => {
  const { month, year } = req.query;
  
  const events = await EventsService.getCalendarMonth(
    parseInt(year as string),
    parseInt(month as string)
  );
  
  res.json({
    success: true,
    data: events
  });
};

export const addAttendee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id, staff_id, notes } = req.body;
  const userId = req.user.id;

  const attendee = await EventsService.addAttendee(id, {
    user_id,
    staff_id,
    notes
  }, userId);
  
  res.json({
    success: true,
    data: attendee
  });
};
```

---

## Services & Data Layer

### Service: `backend/src/services/events.service.ts`

```typescript
import { supabase } from '../config/supabase';

export interface EventFilters {
  status?: string;
  category?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  organizer?: string;
  attendee?: string;
  recurring?: string;
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface EventData {
  title: string;
  description?: string;
  category_id?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  status?: string;
  priority?: string;
  organizer_id: string;
  attendees?: string[];
  notes?: string;
  is_recurring?: boolean;
  reminder_setting?: string;
}

export class EventsService {
  static async list(filters: EventFilters) {
    let query = supabase
      .from('events')
      .select(`
        *,
        category:category_id (
          id,
          name,
          color,
          icon
        ),
        organizer:organizer_id (
          id,
          first_name,
          last_name,
          email
        ),
        attendees:event_attendees (
          id,
          user_id,
          attendance_status,
          response_date,
          user:user_id (
            id,
            first_name,
            last_name,
            email
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.date_from) {
      query = query.gte('start_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('start_date', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.organizer) {
      query = query.eq('organizer_id', filters.organizer);
    }
    if (filters.attendee) {
      query = query.contains('attendees', [filters.attendee]);
    }
    if (filters.recurring !== undefined) {
      query = query.eq('is_recurring', filters.recurring === 'true');
    }

    // Apply sorting and pagination
    const sortColumn = filters.sort_by || 'start_date';
    const ascending = filters.sort_order === 'asc';
    
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;

    const { data: events, error, count } = await query
      .order(sortColumn, { ascending })
      .range(from, to);

    if (error) throw error;

    // Get categories for filter options
    const { data: categories } = await supabase
      .from('event_categories')
      .select('id, name, color, icon')
      .eq('is_active', true);

    return {
      events: events || [],
      categories: categories || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / filters.limit)
      },
      filters: {
        status: ['confirmed', 'pending', 'tentative', 'cancelled'],
        categories: categories?.map(c => c.name) || [],
        priorities: ['high', 'medium', 'low']
      }
    };
  }

  static async create(data: EventData, userId: string) {
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...data,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        category:category_id (
          id,
          name,
          color,
          icon
        ),
        organizer:organizer_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) throw error;

    // Add attendees if provided
    if (data.attendees && data.attendees.length > 0) {
      const attendeeData = data.attendees.map(attendeeId => ({
        event_id: event.id,
        user_id: attendeeId,
        attendance_status: 'pending'
      }));

      await supabase
        .from('event_attendees')
        .insert(attendeeData);
    }

    return event;
  }

  static async getById(id: string) {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        category:category_id (
          id,
          name,
          color,
          icon
        ),
        organizer:organizer_id (
          id,
          first_name,
          last_name,
          email
        ),
        attendees:event_attendees (
          id,
          user_id,
          attendance_status,
          response_date,
          notes,
          user:user_id (
            id,
            first_name,
            last_name,
            email
          )
        ),
        recurrence:event_recurrence (
          id,
          recurrence_type,
          interval_value,
          days_of_week,
          day_of_month,
          end_date,
          max_occurrences
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return event;
  }

  static async update(id: string, data: Partial<EventData>, userId: string) {
    const { data: event, error } = await supabase
      .from('events')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        category:category_id (
          id,
          name,
          color,
          icon
        ),
        organizer:organizer_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) throw error;
    return event;
  }

  static async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async getUpcoming(limit: number = 10) {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        category:category_id (
          id,
          name,
          color,
          icon
        ),
        organizer:organizer_id (
          id,
          first_name,
          last_name
        )
      `)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .eq('status', 'confirmed')
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return events || [];
  }

  static async getCalendarMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        category:category_id (
          id,
          name,
          color,
          icon
        )
      `)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return events || [];
  }

  static async addAttendee(eventId: string, attendeeData: any, userId: string) {
    const { data: attendee, error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id: attendeeData.user_id,
        staff_id: attendeeData.staff_id,
        notes: attendeeData.notes,
        attendance_status: 'pending'
      })
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) throw error;
    return attendee;
  }

  static async createRecurringEvent(eventId: string, recurrenceData: any, userId: string) {
    const { data: recurrence, error } = await supabase
      .from('event_recurrence')
      .insert({
        event_id: eventId,
        ...recurrenceData
      })
      .select()
      .single();

    if (error) throw error;

    // Update event to mark as recurring
    await supabase
      .from('events')
      .update({ is_recurring: true })
      .eq('id', eventId);

    return recurrence;
  }
}
```

---

## Frontend Integration

### API Service: `frontend/src/services/eventsService.ts`

```typescript
import { apiClient } from './apiClient';

export interface EventFilters {
  status?: string;
  category?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  organizer?: string;
  attendee?: string;
  recurring?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface EventData {
  title: string;
  description?: string;
  category_id?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  status?: string;
  priority?: string;
  organizer_id: string;
  attendees?: string[];
  notes?: string;
  is_recurring?: boolean;
  reminder_setting?: string;
}

export class EventsService {
  static async getEvents(filters: EventFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/v1/events?${params.toString()}`);
    return response.data;
  }

  static async createEvent(data: EventData) {
    const response = await apiClient.post('/v1/events', data);
    return response.data;
  }

  static async getEvent(id: string) {
    const response = await apiClient.get(`/v1/events/${id}`);
    return response.data;
  }

  static async updateEvent(id: string, data: Partial<EventData>) {
    const response = await apiClient.put(`/v1/events/${id}`, data);
    return response.data;
  }

  static async deleteEvent(id: string) {
    const response = await apiClient.delete(`/v1/events/${id}`);
    return response.data;
  }

  static async getUpcomingEvents(limit: number = 10) {
    const response = await apiClient.get(`/v1/events/upcoming?limit=${limit}`);
    return response.data;
  }

  static async searchEvents(query: string) {
    const response = await apiClient.get(`/v1/events/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  static async getCategories() {
    const response = await apiClient.get('/v1/events/categories');
    return response.data;
  }

  static async createCategory(data: any) {
    const response = await apiClient.post('/v1/events/categories', data);
    return response.data;
  }

  static async getEventAttendees(eventId: string) {
    const response = await apiClient.get(`/v1/events/${eventId}/attendees`);
    return response.data;
  }

  static async addAttendee(eventId: string, data: any) {
    const response = await apiClient.post(`/v1/events/${eventId}/attendees`, data);
    return response.data;
  }

  static async updateAttendance(eventId: string, userId: string, data: any) {
    const response = await apiClient.put(`/v1/events/${eventId}/attendees/${userId}`, data);
    return response.data;
  }

  static async removeAttendee(eventId: string, userId: string) {
    const response = await apiClient.delete(`/v1/events/${eventId}/attendees/${userId}`);
    return response.data;
  }

  static async updateEventStatus(eventId: string, status: string) {
    const response = await apiClient.put(`/v1/events/${eventId}/status`, { status });
    return response.data;
  }

  static async updateEventPriority(eventId: string, priority: string) {
    const response = await apiClient.put(`/v1/events/${eventId}/priority`, { priority });
    return response.data;
  }

  static async cancelEvent(eventId: string, reason?: string) {
    const response = await apiClient.post(`/v1/events/${eventId}/cancel`, { reason });
    return response.data;
  }

  static async rescheduleEvent(eventId: string, data: any) {
    const response = await apiClient.post(`/v1/events/${eventId}/reschedule`, data);
    return response.data;
  }

  static async getCalendarMonth(year: number, month: number) {
    const response = await apiClient.get(`/v1/events/calendar?year=${year}&month=${month}`);
    return response.data;
  }

  static async getCalendarWeek(date: string) {
    const response = await apiClient.get(`/v1/events/calendar/week?date=${date}`);
    return response.data;
  }

  static async getCalendarDay(date: string) {
    const response = await apiClient.get(`/v1/events/calendar/day?date=${date}`);
    return response.data;
  }

  static async createRecurringEvent(eventId: string, data: any) {
    const response = await apiClient.post(`/v1/events/${eventId}/recurring`, data);
    return response.data;
  }
}
```

---

## Implementation Plan

### Step 1: Database Setup
**Files to create:**
- `backend/supabase/migrations/001_create_events_tables.sql`
- `backend/supabase/migrations/002_create_events_functions.sql`

**Tasks:**
1. Create all event-related tables
2. Add performance indexes
3. Create recurring events functions
4. Set up reminder system tables
5. Test all database functions

**Acceptance Criteria:**
- All tables created successfully
- Indexes improve query performance
- Recurring events functions work correctly
- Reminder system is properly set up
- Full-text search works

### Step 2: Backend Services
**Files to create:**
- `backend/src/services/events.service.ts`
- `backend/src/validators/event.validator.ts`
- `backend/src/controllers/events.controller.ts`
- `backend/src/routes/events.routes.ts`

**Tasks:**
1. Implement EventsService with all CRUD operations
2. Add recurring events support
3. Create calendar view functions
4. Add attendee management
5. Implement reminder system

**Acceptance Criteria:**
- All service methods work correctly
- Recurring events are generated properly
- Calendar views return correct data
- Attendee management works
- Reminders are scheduled correctly

### Step 3: Frontend Integration
**Files to create:**
- `frontend/src/services/eventsService.ts`
- `frontend/src/hooks/useEvents.ts`

**Tasks:**
1. Create API service layer
2. Implement React hooks for state management
3. Add calendar view functionality
4. Test all CRUD operations
5. Implement recurring events UI

**Acceptance Criteria:**
- All API calls work correctly
- Calendar views display properly
- State management is efficient
- Recurring events UI works
- Real-time updates work

### Step 4: Testing & Validation
**Files to create:**
- `backend/src/tests/events.service.test.ts`
- `backend/src/tests/events.controller.test.ts`
- `frontend/src/tests/eventsService.test.ts`

**Tasks:**
1. Test all service methods
2. Test API endpoints
3. Test recurring events logic
4. Test calendar functionality
5. Test attendee management

**Acceptance Criteria:**
- All tests pass
- Recurring events work correctly
- Calendar views are accurate
- Attendee management functions properly
- Performance is acceptable

This implementation provides a complete, scalable event management system with recurring events, attendee tracking, calendar views, and reminder capabilities suitable for enterprise event management needs.
