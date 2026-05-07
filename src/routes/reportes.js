const { Router } = require('express');
const { reparacionesPorPeriodo, ingresosPorPeriodo, inventarioActual } = require('../controllers/reporteController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

const router = Router();

const soloAdmin = verificarRol('administrador');

router.get('/reparaciones', verificarToken, soloAdmin, reparacionesPorPeriodo);
router.get('/ingresos', verificarToken, soloAdmin, ingresosPorPeriodo);
router.get('/inventario', verificarToken, soloAdmin, inventarioActual);

module.exports = router;
