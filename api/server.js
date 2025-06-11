const express = require('express');
const cors = require('cors');
const path = require('path');
const scheduleService = require('./bigquery-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Routes

// Get week schedule
app.get('/api/schedule/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const schedules = await scheduleService.getWeekSchedule(startDate, endDate);
    res.json(schedules);
  } catch (error) {
    console.error('Error getting week schedule:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

// Get all staff
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await scheduleService.getActiveStaff();
    res.json(staff);
  } catch (error) {
    console.error('Error getting staff:', error);
    res.status(500).json({ error: 'Failed to get staff' });
  }
});

// Add schedule
app.post('/api/schedule', async (req, res) => {
  try {
    const { staffId, workDate, shift } = req.body;
    const scheduleId = await scheduleService.addSchedule(staffId, workDate, shift);
    res.json({ success: true, scheduleId });
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
});

// Update schedule
app.put('/api/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, workDate, shift } = req.body;
    await scheduleService.updateSchedule(id, staffId, workDate, shift);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Delete schedule
app.delete('/api/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Update staff status
app.put('/api/staff/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await scheduleService.updateStaffStatus(id, status);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating staff status:', error);
    res.status(500).json({ error: 'Failed to update staff status' });
  }
});

// Add new staff
app.post('/api/staff', async (req, res) => {
  try {
    const { name, status } = req.body;
    const staffId = await scheduleService.addStaff(name, status);
    res.json({ success: true, staffId });
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ error: 'Failed to add staff' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../page/schedule.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the schedule management system`);
}); 