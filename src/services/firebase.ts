import app, { auth, db, storage, functions } from '../config/firebase';

// Re-exportar para mantener la compatibilidad con el código existente
export { auth, db, storage, functions };
export default app;