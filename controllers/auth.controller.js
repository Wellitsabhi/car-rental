const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function signup(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Username and password are required" });
  }

  try {
    const existingUser = await pool.query(
      `select id from users where username = $1`,
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `insert into users (username, password) values ($1, $2) returning id, username`,
      [username, hashedPassword]
    );

    res.status(201).json({
      success: true,
      data: {
        message: "User created successfully",
        userId: result.rows[0].id,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

async function login(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "invalid inputs" });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "user does not exist" });
    }

    const user = result.rows[0];

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res
        .status(401)
        .json({ success: false, error: "incorrect password" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      data: {
        message: "Login successful",
        token: token,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "server error" });
  }
}

module.exports = {
  signup: signup,
  login: login,
};
