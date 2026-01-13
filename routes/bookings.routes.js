const express = require("express")
const router = express.Router()
const auth = require("../middlewares/auth.middleware")
const controller = require("../controllers/bookings.controller")

router.post("/", auth, controller.createBooking)
router.get("/", auth, controller.getBookings)
router.put("/:bookingId", auth, controller.updateBooking)
router.delete("/:bookingId", auth, controller.deleteBooking)

module.exports = router
