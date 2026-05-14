const { Router } = require('express');
const { listar, obtener, actualizar } = require('../controllers/clienteController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

const router = Router();

router.get('/', verificarToken, verificarRol('administrador'), listar);
router.get('/:id', verificarToken, verificarRol('administrador'), obtener);
router.put('/:id', verificarToken, verificarRol('administrador'), actualizar);

module.exports = router;
