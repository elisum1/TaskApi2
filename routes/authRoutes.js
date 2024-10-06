// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

const router = express.Router();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'elias.um94@gmail.com',
    pass: 'gjms nzph mjaq knqw'
  }
});

// Registro de usuario
router.post('/register', async (req, res) => {
  const { username, email, password, phone, city } = req.body;
  console.log('Registro de usuario:', { username, email, phone, city });

  // Validación de campos obligatorios
  if (!username || !email || !password) {
    console.log('Error: Campos obligatorios no proporcionados');
    return res.status(400).json({ error: 'Los campos username, email y password son obligatorios' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('Error: El usuario ya existe');
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      city: city || null
    });

    console.log('Usuario registrado exitosamente:', newUser);
    res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
  } catch (error) {
    console.error('Error registrando el usuario:', error);
    res.status(500).json({ error: 'Error registrando el usuario' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Intento de inicio de sesión:', { email });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Error: Usuario no encontrado');
      return res.status(401).json({ error: 'Email o contraseña inválidos' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Error: Contraseña incorrecta');
      return res.status(401).json({ error: 'Email o contraseña inválidos' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    console.log('Inicio de sesión exitoso:', { token, user });
    res.json({ message: 'Inicio de sesión exitoso', token, user });
  } catch (error) {
    console.error('Error iniciando sesión:', error);
    res.status(500).json({ error: 'Error iniciando sesión' });
  }
});

// Logout de usuario
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  console.log('Cierre de sesión exitoso');
  res.status(200).json({ message: 'Cierre de sesión exitoso' });
});

// Solicitar recuperación de contraseña
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  console.log('Solicitud de recuperación de contraseña:', { email });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Error: Usuario no encontrado');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3180000; // 1 hora

    await User.update({ resetToken, resetTokenExpiry }, { where: { id: user.id } });
    console.log('Token de recuperación generado:', resetToken);

    const resetUrl = `http://${req.headers.host}/api/auth/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: email,
      from: 'no-reply@tuapp.com',
      subject: 'Solicitud de recuperación de contraseña',
      html: `<p>Hiciste una solicitud de recuperación de contraseña. Haz clic en el siguiente enlace para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no hiciste esta solicitud, ignora este correo.</p>`
    });

    res.status(200).json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
});

// Mostrar formulario de restablecimiento de contraseña
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  console.log('Accediendo al formulario de restablecimiento de contraseña con token:', token);

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Restablecer Contraseña</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <h1 class="text-center text-4xl font-extrabold text-gray-900">Restablecer Contraseña</h1>
          <form action="/api/auth/reset-password" method="POST" class="mt-8 space-y-6">
            <input type="hidden" name="token" value="${token}" />
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">Nueva Contraseña:</label>
              <input
                type="password"
                name="newPassword"
                required
                class="mt-1 px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Introduce tu nueva contraseña"
              />
            </div>
            <div>
              <button
                type="submit"
                class="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Restablecer Contraseña
              </button>
            </div>
          </form>
        </div>
      </body>
    </html>
  `);
  
});

// Restablecer contraseña
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  console.log('Restablecimiento de contraseña con token:', token);

  try {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      console.log('Error: Token inválido o expirado');
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword, resetToken: null, resetTokenExpiry: null }, { where: { id: user.id } });

    console.log('Contraseña restablecida exitosamente');
    res.redirect('http://localhost:5173'); 
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
});

// Actualizar perfil de usuario
router.put('/update', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { username, email, phone, city, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar la información de usuario
    user.username = username || user.username;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.city = city || user.city;

    // Verificar y actualizar la contraseña si se proporciona la nueva
    if (newPassword) {
      // Verificar si la contraseña actual es correcta
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }

      // Encriptar la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = await user.save();
    res.json({ message: 'Perfil actualizado exitosamente', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});

module.exports = router;
