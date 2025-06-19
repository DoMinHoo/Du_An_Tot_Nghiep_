const express = require('express');
const router = express.Router();
const materialController = require('../controllers/matetial.controller');


// Route để thêm vật liệu mới
router.post('/', materialController.addMaterial);

router.get("/", materialController.getAllMaterials);

router.get("/:id", materialController.getMaterialById);

router.put("/:id", materialController.updateMaterial);

router.delete("/:id", materialController.deleteMaterialById);

module.exports = router;