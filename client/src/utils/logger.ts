export class Logger {
    static info(message: string, data: any = null) {
        const timestamp = new Date().toISOString();
        console.log(`%c[INFO] [${timestamp}] %c${message}`, 'color: #007bff; font-weight: bold;', 'color: inherit;', data || '');
    }

    static error(message: string, error: any = null) {
        const timestamp = new Date().toISOString();
        console.error(`%c[ERROR] [${timestamp}] %c${message}`, 'color: #dc3545; font-weight: bold;', 'color: inherit;', error || '');
    }

    static warn(message: string, data: any = null) {
        const timestamp = new Date().toISOString();
        console.warn(`%c[WARN] [${timestamp}] %c${message}`, 'color: #ffc107; font-weight: bold;', 'color: inherit;', data || '');
    }

    static debug(message: string, data: any = null) {
        const timestamp = new Date().toISOString();
        console.log(`%c[DEBUG] [${timestamp}] %c${message}`, 'color: #6c757d; font-weight: bold;', 'color: inherit;', data || '');
    }
}
