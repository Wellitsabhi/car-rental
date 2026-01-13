const db = require("../config/db");

async function createBooking(req, res) {
  const carName = req.body.carName;
  const days = req.body.days;
  const rentPerDay = req.body.rentPerDay;

  if (!carName || !days || !rentPerDay || days > 365 || rentPerDay > 2000) {
    return res.status(400).json({ success: false, error: "invalid inputs" });
  }

  const totalCost = days * rentPerDay;

  const result = await db.query(
    "INSERT INTO bookings (user_id, car_name, days, rent_per_day, status) VALUES ($1,$2,$3,$4,'booked') RETURNING id",
    [req.user.userId, carName, days, rentPerDay]
  );

  res.status(201).json({
    success: true,
    data: {
      message: "Booking created successfully",
      bookingId: result.rows[0].id,
      totalCost: totalCost,
    },
  });
}

async function getBookings(req, res) {
  const userId = req.user.userId;
  const bookingId = req.query.bookingId;
  const summary = req.query.summary;

  if (summary === "true") {
    const result = await db.query(
      "SELECT COUNT(*) AS total_bookings, COALESCE(SUM(days * rent_per_day),0) AS total_amount FROM bookings WHERE user_id = $1 AND status IN ('booked','completed')",
      [userId]
    );

    return res.json({
      success: true,
      data: {
        userId: userId,
        username: req.user.username,
        totalBookings: parseInt(result.rows[0].total_bookings),
        totalAmountSpent: parseInt(result.rows[0].total_amount),
      },
    });
  }

  if (bookingId) {
    const result = await db.query(
      "SELECT id, car_name, days, rent_per_day, status FROM bookings WHERE id = $1 AND user_id = $2",
      [bookingId, userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "bookingId not found" });
    }

    const b = result.rows[0];

    return res.json({
      success: true,
      data: [
        {
          id: b.id,
          car_name: b.car_name,
          days: b.days,
          rent_per_day: b.rent_per_day,
          status: b.status,
          totalCost: b.days * b.rent_per_day,
        },
      ],
    });
  }

  const result = await db.query(
    "SELECT id, car_name, days, rent_per_day, status FROM bookings WHERE user_id = $1",
    [userId]
  );

  const data = result.rows.map((b) => {
    return {
      id: b.id,
      car_name: b.car_name,
      days: b.days,
      rent_per_day: b.rent_per_day,
      status: b.status,
      totalCost: b.days * b.rent_per_day,
    };
  });

  res.json({
    success: true,
    data: data,
  });
}

async function updateBooking(req, res) {
  const userId = req.user.userId;
  const bookingId = req.params.bookingId;

  const hasStatus = req.body.status !== undefined;
  const hasDetails =
    req.body.carName !== undefined ||
    req.body.days !== undefined ||
    req.body.rentPerDay !== undefined;

  if (hasStatus && hasDetails) {
    return res.status(400).json({ success: false, error: "invalid inputs" });
  }

  const check = await db.query("SELECT * FROM bookings WHERE id = $1", [
    bookingId,
  ]);

  if (check.rows.length === 0) {
    return res.status(404).json({ success: false, error: "booking not found" });
  }

  const booking = check.rows[0];

  if (booking.user_id !== userId) {
    return res
      .status(403)
      .json({ success: false, error: "booking does not belong to user" });
  }

  const status = req.body.status;
  const carName = req.body.carName;
  const days = req.body.days;
  const rentPerDay = req.body.rentPerDay;

  if (status) {
    if (!["booked", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, error: "invalid inputs" });
    }

    const result = await db.query(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, bookingId]
    );

    const b = result.rows[0];

    return res.json({
      success: true,
      data: {
        message: "Booking updated successfully",
        booking: {
          id: b.id,
          car_name: b.car_name,
          days: b.days,
          rent_per_day: b.rent_per_day,
          status: b.status,
          totalCost: b.days * b.rent_per_day,
        },
      },
    });
  }

  if (!carName || !days || !rentPerDay || days > 365 || rentPerDay > 2000) {
    return res.status(400).json({ success: false, error: "invalid inputs" });
  }

  const result = await db.query(
    "UPDATE bookings SET car_name = $1, days = $2, rent_per_day = $3 WHERE id = $4 RETURNING *",
    [carName, days, rentPerDay, bookingId]
  );

  const b = result.rows[0];

  res.json({
    success: true,
    data: {
      message: "Booking updated successfully",
      booking: {
        id: b.id,
        car_name: b.car_name,
        days: b.days,
        rent_per_day: b.rent_per_day,
        status: b.status,
        totalCost: b.days * b.rent_per_day,
      },
    },
  });
}

async function deleteBooking(req, res) {
  const userId = req.user.userId;
  const bookingId = req.params.bookingId;

  const check = await db.query("SELECT user_id FROM bookings WHERE id = $1", [
    bookingId,
  ]);

  if (check.rows.length === 0) {
    return res.status(404).json({ success: false, error: "booking not found" });
  }

  if (check.rows[0].user_id !== userId) {
    return res
      .status(403)
      .json({ success: false, error: "booking does not belong to user" });
  }

  await db.query("DELETE FROM bookings WHERE id = $1", [bookingId]);

  res.json({
    success: true,
    data: {
      message: "Booking deleted successfully",
    },
  });
}

module.exports = {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
};
