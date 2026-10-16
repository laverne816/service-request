const router = require('express').Router();
const c = require('../controllers/requestController');
const { validateFull, validatePartial } = require('../middleware/validate');

router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/', validateFull, c.create);
router.put('/:id', validateFull, c.replace);
router.patch('/:id', validatePartial, c.update);
router.delete('/:id', c.remove);

module.exports = router;
