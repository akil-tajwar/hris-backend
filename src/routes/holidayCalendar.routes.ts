import { Router } from 'express'
import {
  createHolidayCalendarController,
  deleteHolidayCalendarController,
  editHolidayCalendarController,
  getAllHolidayCalendarsController,
  getHolidayCalendarController,
  getHolidayCalendarWithHolidaysController,
} from '../controllers/holidayCalendar.controller'
import { authenticateUser } from '../middlewares/auth.middleware'

const router = Router()

router.post('/create', authenticateUser, createHolidayCalendarController)
router.get('/getAll', authenticateUser, getAllHolidayCalendarsController)
router.get('/getById/:id', authenticateUser, getHolidayCalendarController)
router.get(
  '/getWithHolidays/:id',
  authenticateUser,
  getHolidayCalendarWithHolidaysController
)
router.patch('/edit/:id', authenticateUser, editHolidayCalendarController)
router.delete('/delete/:id', authenticateUser, deleteHolidayCalendarController)

export default router





// import { Router } from 'express'
// import {
//   createHolidayController,
//   deleteHolidayController,
//   editHolidayController,
//   getAllHolidaysController,
//   getHolidayController,
// } from '../controllers/holidays.controller'
// import { authenticateUser } from '../middlewares/auth.middleware'

// const router = Router()

// router.post('/create', authenticateUser, createHolidayController)
// router.get('/getAll', authenticateUser, getAllHolidaysController)
// router.get('/getById/:id', authenticateUser, getHolidayController)
// router.patch('/edit/:id', authenticateUser, editHolidayController)
// router.delete('/delete/:id', authenticateUser, deleteHolidayController)

// export default router
