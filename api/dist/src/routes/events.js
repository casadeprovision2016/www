"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const eventsController_1 = require("../controllers/eventsController");
const router = (0, express_1.Router)();
// Rotas públicas (sem autenticação)
router.get('/stats', eventsController_1.getEventStats);
// Rotas que requerem autenticação
router.use(auth_1.authenticateToken);
// Listar eventos com filtros e paginação
router.get('/', (0, validation_1.validateAndSanitize)(validation_1.schemas.pagination.merge(validation_1.schemas.eventQuery)), eventsController_1.getEvents);
// Buscar evento por ID
router.get('/:id', eventsController_1.getEventById);
// Criar evento (leader ou admin)
router.post('/', auth_1.requireLeaderOrAdmin, (0, validation_1.validateAndSanitize)(validation_1.schemas.createEvent), eventsController_1.createEvent);
// Atualizar evento (leader ou admin)
router.put('/:id', auth_1.requireLeaderOrAdmin, (0, validation_1.validateAndSanitize)(validation_1.schemas.updateEvent), eventsController_1.updateEvent);
// Deletar evento (leader ou admin)
router.delete('/:id', auth_1.requireLeaderOrAdmin, eventsController_1.deleteEvent);
// Inscrever-se em evento
router.post('/:id/register', auth_1.requireMemberOrAbove, eventsController_1.registerForEvent);
// Cancelar inscrição em evento
router.delete('/:id/register', auth_1.requireMemberOrAbove, eventsController_1.unregisterFromEvent);
exports.default = router;
//# sourceMappingURL=events.js.map