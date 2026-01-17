import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import Database from 'better-sqlite3'

const app = new Hono()
const db = new Database('hospital.db')

// Validation function
const validateRoomData = (data: any) => {
  const errors = []
  
  if (!data.RoomNumber || typeof data.RoomNumber !== 'string') {
    errors.push('RoomNumber is required and must be a string')
  }
  if (!data.Type || typeof data.Type !== 'string') {
    errors.push('Type is required and must be a string')
  }
  if (!data.Capacity || typeof data.Capacity !== 'number' || data.Capacity <= 0) {
    errors.push('Capacity is required and must be a positive number')
  }
  if (!data.Status || typeof data.Status !== 'string') {
    errors.push('Status is required and must be a string')
  }
  
  return errors
}

/* เพิ่มห้อง */
app.post('/rooms', async (c) => {
  try {
    const body = await c.req.json()
    const { RoomNumber, Type, Capacity, Status } = body

    const errors = validateRoomData({ RoomNumber, Type, Capacity, Status })
    if (errors.length > 0) {
      return c.json({ message: 'Validation error', errors }, 400)
    }

    const stmt = db.prepare(`
      INSERT INTO HospitalRoom (RoomNumber, Type, Capacity, Status)
      VALUES (?, ?, ?, ?)
    `)

    const result = stmt.run(RoomNumber, Type, Capacity, Status)

    return c.json({ 
      message: 'Room created successfully',
      RoomID: result.lastInsertRowid
    }, 201)
  } catch (error) {
    return c.json({ message: 'Error creating room', error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

/* ดูห้องทั้งหมด */
app.get('/rooms', (c) => {
  try {
    const rooms = db.prepare(`SELECT * FROM HospitalRoom`).all()
    return c.json(rooms)
  } catch (error) {
    return c.json({ message: 'Error fetching rooms', error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

/* ดูห้องตามID */
app.get('/rooms/:id', (c) => {
  try {
    const id = c.req.param('id')
    
    if (!id || isNaN(Number(id))) {
      return c.json({ message: 'Invalid room ID' }, 400)
    }

    const room = db.prepare(`
      SELECT * FROM HospitalRoom WHERE RoomID = ?
    `).get(id)

    if (!room) {
      return c.json({ message: 'Room not found' }, 404)
    }

    return c.json(room)
  } catch (error) {
    return c.json({ message: 'Error fetching room', error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

/* แก้ไขข้อมูลห้อง */
app.put('/rooms/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    if (!id || isNaN(Number(id))) {
      return c.json({ message: 'Invalid room ID' }, 400)
    }

    const body = await c.req.json()
    const { RoomNumber, Type, Capacity, Status } = body

    const errors = validateRoomData({ RoomNumber, Type, Capacity, Status })
    if (errors.length > 0) {
      return c.json({ message: 'Validation error', errors }, 400)
    }

    const stmt = db.prepare(`
      UPDATE HospitalRoom
      SET RoomNumber = ?, Type = ?, Capacity = ?, Status = ?
      WHERE RoomID = ?
    `)

    const result = stmt.run(RoomNumber, Type, Capacity, Status, id)

    if (result.changes === 0) {
      return c.json({ message: 'Room not found' }, 404)
    }

    return c.json({ message: 'Room updated successfully' })
  } catch (error) {
    return c.json({ message: 'Error updating room', error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

/* ลบห้อง */
app.delete('/rooms/:id', (c) => {
  try {
    const id = c.req.param('id')
    
    if (!id || isNaN(Number(id))) {
      return c.json({ message: 'Invalid room ID' }, 400)
    }

    const result = db.prepare(`
      DELETE FROM HospitalRoom WHERE RoomID = ?
    `).run(id)

    if (result.changes === 0) {
      return c.json({ message: 'Room not found' }, 404)
    }

    return c.json({ message: 'Room deleted successfully' })
  } catch (error) {
    return c.json({ message: 'Error deleting room', error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})




serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
