// Configuration service using GSettings
import { JiraConfig } from './types';

export class ConfigService {
  private readonly settings: any;

  constructor(settings: any) {
    this.settings = settings;
  }

  public getConfig(): JiraConfig {
    return {
      url: this.settings.get_string('jira-url'),
      email: this.settings.get_string('jira-email'),
      auth: this.settings.get_string('jira-auth'),
      checkInterval: this.settings.get_int('check-interval'),
      webhookUrl: this.settings.get_string('webhook-url') || undefined,
    };
  }

  public setConfig(config: Partial<JiraConfig>): void {
    if (config.url !== undefined) {
      this.settings.set_string('jira-url', config.url);
    }
    if (config.email !== undefined) {
      this.settings.set_string('jira-email', config.email);
    }
    if (config.auth !== undefined) {
      this.settings.set_string('jira-auth', config.auth);
    }
    if (config.checkInterval !== undefined) {
      this.settings.set_int('check-interval', config.checkInterval);
    }
    if (config.webhookUrl !== undefined) {
      this.settings.set_string('webhook-url', config.webhookUrl);
    }
  }

  public isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config.url && config.email && config.auth);
  }
}
