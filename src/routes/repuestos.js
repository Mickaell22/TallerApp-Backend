const { Router } = require('express');
const { listar, obtener, crear, actualizar, eliminar, alertasStockMinimo } = require('../controllers/repuestoController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

const router = Router();

const soloStaff = verificarRol('administrador', 'tecnico');

// Ruta específica antes de la paramétrica
router.get('/alertas/stock-minimo', verificarToken, soloStaff, alertasStockMinimo);

router.get('/', verificarToken, soloStaff, listar);
router.get('/:id', verificarToken, soloStaff, obtener);
router.post('/', verificarToken, soloStaff, crear);
router.put('/:id', verificarToken, soloStaff, actualizar);
router.delete('/:id', verificarToken, verificarRol('administrador'), eliminar);

module.exports = router;
