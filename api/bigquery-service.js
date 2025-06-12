const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

// Initialize BigQuery client with service account
const bigquery = new BigQuery({
  keyFilename: path.join(__dirname, '../API_key/bigquery.json'),
  projectId: 'tools-451916'
});

const dataset = bigquery.dataset('part_time_schedule');

class ScheduleService {
  // Get all schedules for a week
  async getWeekSchedule(startDate, endDate) {
    try {
      const query = `
        SELECT 
          s.id,
          s.staff_id,
          s.work_date,
          s.shift,
          st.name as staff_name,
          st.status as staff_status
        FROM \`tools-451916.part_time_schedule.schedule\` s
        LEFT JOIN \`tools-451916.part_time_schedule.staff\` st ON s.staff_id = st.id
        WHERE s.work_date BETWEEN @startDate AND @endDate
        ORDER BY s.work_date, s.shift
      `;
      
      const options = {
        query: query,
        params: {
          startDate: startDate,
          endDate: endDate
        }
      };
      
      const [rows] = await bigquery.query(options);
      return rows;
    } catch (error) {
      console.error('Error getting week schedule:', error);
      throw error;
    }
  }

  // Get all active staff
  async getActiveStaff() {
    try {
      const query = `
        SELECT id, name, status
        FROM \`tools-451916.part_time_schedule.staff\`
        ORDER BY name
      `;
      
      const [rows] = await bigquery.query(query);
      return rows;
    } catch (error) {
      console.error('Error getting staff:', error);
      throw error;
    }
  }

  // Add schedule entry
  async addSchedule(staffId, workDate, shift) {
    try {
      const scheduleId = this.generateUUID();
      const query = `
        INSERT INTO \`tools-451916.part_time_schedule.schedule\` (id, staff_id, work_date, shift)
        VALUES (@id, @staffId, @workDate, @shift)
      `;
      
      const options = {
        query: query,
        params: {
          id: scheduleId,
          staffId: staffId,
          workDate: workDate,
          shift: shift
        }
      };
      
      await bigquery.query(options);
      return scheduleId;
    } catch (error) {
      console.error('Error adding schedule:', error);
      throw error;
    }
  }

  // Update schedule entry
  async updateSchedule(scheduleId, staffId, workDate, shift) {
    try {
      const query = `
        UPDATE \`tools-451916.part_time_schedule.schedule\`
        SET staff_id = @staffId, work_date = @workDate, shift = @shift
        WHERE id = @id
      `;
      
      const options = {
        query: query,
        params: {
          id: scheduleId,
          staffId: staffId,
          workDate: workDate,
          shift: shift
        }
      };
      
      await bigquery.query(options);
      return true;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  // Delete schedule entry
  async deleteSchedule(scheduleId) {
    try {
      const query = `
        DELETE FROM \`tools-451916.part_time_schedule.schedule\`
        WHERE id = @id
      `;
      
      const options = {
        query: query,
        params: {
          id: scheduleId
        }
      };
      
      await bigquery.query(options);
      return true;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  // Update staff status
  async updateStaffStatus(staffId, status) {
    try {
      const query = `
        UPDATE \`tools-451916.part_time_schedule.staff\`
        SET status = @status
        WHERE id = @id
      `;
      
      const options = {
        query: query,
        params: {
          id: staffId,
          status: status
        }
      };
      
      await bigquery.query(options);
      return true;
    } catch (error) {
      console.error('Error updating staff status:', error);
      throw error;
    }
  }

  // Update staff information
  async updateStaff(staffId, name, status) {
    try {
      const query = `
        UPDATE \`tools-451916.part_time_schedule.staff\`
        SET name = @name, status = @status
        WHERE id = @id
      `;
      
      const options = {
        query: query,
        params: {
          id: staffId,
          name: name,
          status: status
        }
      };
      
      await bigquery.query(options);
      return true;
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  }

  // Add new staff
  async addStaff(name, status = 'Đang làm') {
    try {
      const staffId = this.generateUUID();
      const query = `
        INSERT INTO \`tools-451916.part_time_schedule.staff\` (id, name, status)
        VALUES (@id, @name, @status)
      `;
      
      const options = {
        query: query,
        params: {
          id: staffId,
          name: name,
          status: status
        }
      };
      
      await bigquery.query(options);
      return staffId;
    } catch (error) {
      console.error('Error adding staff:', error);
      throw error;
    }
  }

  // Delete staff and all their schedules
  async deleteStaff(staffId) {
    try {
      console.log(`Deleting staff ${staffId} and all their schedules...`);
      
      // First, delete all schedules for this staff member
      const deleteSchedulesQuery = `
        DELETE FROM \`tools-451916.part_time_schedule.schedule\`
        WHERE staff_id = @staffId
      `;
      
      const scheduleOptions = {
        query: deleteSchedulesQuery,
        params: {
          staffId: staffId
        }
      };
      
      const [scheduleResult] = await bigquery.query(scheduleOptions);
      console.log(`Deleted ${scheduleResult.totalBytesProcessed ? 'some' : 'no'} schedules for staff ${staffId}`);
      
      // Then, delete the staff member
      const deleteStaffQuery = `
        DELETE FROM \`tools-451916.part_time_schedule.staff\`
        WHERE id = @staffId
      `;
      
      const staffOptions = {
        query: deleteStaffQuery,
        params: {
          staffId: staffId
        }
      };
      
      const [staffResult] = await bigquery.query(staffOptions);
      console.log(`Staff ${staffId} deleted successfully`);
      
      return {
        success: true,
        message: 'Staff and all their schedules deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  }

  // Generate UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = new ScheduleService(); 