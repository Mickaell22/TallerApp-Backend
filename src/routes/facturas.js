const { Router } = require('express');
const { listar, obtener, crear, descargarPDF } = require('../controllers/facturaController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

const router = Router();

const soloAdmin = verificarRol('administrador');
const soloStaff = verificarRol('administrador', 'tecnico');

// Ruta específica antes de la paramétrica
router.get('/:id/pdf', verificarToken, soloStaff, descargarPDF);

router.get('/', verificarToken, soloStaff, listar);
router.get('/:id', verificarToken, soloStaff, obtener);
router.post('/', verificarToken, soloAdmin, crear);

module.exports = router;
