const { Router } = require('express');
const { listar, obtener, seguimiento, crear, actualizarEstado, historialCliente } = require('../controllers/reparacionController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

const router = Router();

// Rutas específicas antes de las paramétricas para evitar conflictos
router.get('/seguimiento/:codigo', seguimiento);
router.get('/cliente/:cliente_id', verificarToken, historialCliente);

router.get('/', verificarToken, verificarRol('administrador', 'tecnico'), listar);
router.post('/', verificarToken, verificarRol('administrador', 'tecnico'), crear);
router.get('/:id', verificarToken, verificarRol('administrador', 'tecnico', 'cliente'), obtener);
router.put('/:id/estado', verificarToken, verificarRol('administrador', 'tecnico'), actualizarEstado);

module.exports = router;
