const { Router } = require('express');
const { listar } = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

const router = Router();

router.get('/', verificarToken, verificarRol('administrador'), listar);

module.exports = router;
