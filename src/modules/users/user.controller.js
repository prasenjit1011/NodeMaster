const User = require('./user.model');

// Create User
exports.createUser = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();
    res.json(saved);
  } catch (err) {
    next(err);
  }
};

// Get All Users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Get Single User
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update User
exports.updateUser = async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete User
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};