import { createLogger } from 'winston';
import { loggingConfig } from '@/config/logging';

// Create a custom logger with different transports
const logger = createLogger(loggingConfig);

export default logger;
