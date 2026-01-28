import app from './app.js';
import { config } from './config/index.js';
import { initDb } from './models/init.js';
import { logServerStart } from './middleware/logger.js';

initDb();

app.listen(config.port, () => {
  logServerStart(config.port);
});
