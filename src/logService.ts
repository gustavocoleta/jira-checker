// Logging service
export class LogService {
  private readonly extensionName: string;

  constructor(extensionName: string) {
    this.extensionName = extensionName;
  }

  public info(message: string): void {
    console.log(`[${this.extensionName}] INFO: ${message}`);
  }

  public error(message: string): void {
    console.error(`[${this.extensionName}] ERROR: ${message}`);
  }

  public warning(message: string): void {
    console.warn(`[${this.extensionName}] WARNING: ${message}`);
  }
}
