import { Router } from 'express';
import { FileController } from './file.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), FileController.uploadFile);
router.post('/avatar', upload.single('file'), FileController.uploadAvatar);
router.get('/', FileController.listFiles);
router.get('/stats', FileController.getFileStats);
router.get('/:id', FileController.getFileById);
router.delete('/:id', FileController.deleteFile);

export default router;
