// Main extension logic
import { ConfigService } from './configService';
import { LogService } from './logService';
import { TaskService } from './taskService';
import { ExtensionMetadata, JiraTask } from './types';

export class JiraCheckerExtension {
  private St: any;
  private Gio: any;
  private GLib: any;
  private Soup: any;
  private Main: any;
  private PanelMenu: any;
  private PopupMenu: any;
  private Clutter: any;

  private settings: any;
  private configService: ConfigService;
  private taskService: TaskService;
  private logger: LogService;

  private indicator: any;
  private timeoutId: number | null = null;
  private lastTasks: JiraTask[] = [];
  private metadata: ExtensionMetadata;

  constructor(metadata: ExtensionMetadata, settings: any, imports: any) {
    this.metadata = metadata;
    this.St = imports.gi.St;
    this.Gio = imports.gi.Gio;
    this.GLib = imports.gi.GLib;
    this.Soup = imports.gi.Soup;
    this.Main = imports.ui.main;
    this.PanelMenu = imports.ui.panelMenu;
    this.PopupMenu = imports.ui.popupMenu;
    this.Clutter = imports.gi.Clutter;

    this.settings = settings;
    this.configService = new ConfigService(settings);
    this.taskService = new TaskService(this.Soup, this.GLib);
    this.logger = new LogService('Jira Checker');
  }

  public enable(): void {
    this.logger.info('[Jira Checker] Enabling extension');

    // Create indicator
    this.indicator = new this.PanelMenu.Button(0, 'Jira Checker', false);

    // Create icon
    const icon = new this.St.Icon({
      icon_name: 'dialog-information-symbolic',
      style_class: 'system-status-icon',
    });

    this.indicator.add_child(icon);

    // Add to panel
    this.Main.panel.addToStatusArea('jira-checker', this.indicator);

    // Build initial menu
    this.buildMenu([]);

    // Start checking tasks if configured
    if (this.configService.isConfigured()) {
      this.startTaskCheck();
    } else {
      this.logger.warning(
        '[Jira Checker] Extension not configured. Please set Jira credentials in preferences.',
      );
    }
  }

  public disable(): void {
    this.logger.info('[Jira Checker] Disabling extension');

    if (this.timeoutId !== null) {
      this.GLib.Source.remove(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = null;
    }
  }

  private startTaskCheck(): void {
    // Check immediately
    this.checkTasks();

    // Schedule periodic checks
    const config = this.configService.getConfig();
    const intervalMinutes = config.checkInterval || 5;
    const intervalMs = intervalMinutes * 60 * 1000;

    this.timeoutId = this.GLib.timeout_add(
      this.GLib.PRIORITY_DEFAULT,
      intervalMs,
      () => {
        this.checkTasks();
        return this.GLib.SOURCE_CONTINUE;
      },
    );
  }

  private async checkTasks(): Promise<void> {
    try {
      this.logger.info('[Jira Checker] Checking for tasks...');

      const config = this.configService.getConfig();
      const response = await this.taskService.getTasks(config);

      if (response.errorMessages) {
        this.logger.error(
          `[Jira Checker] ${response.errorMessages.join(', ')}`,
        );
        return;
      }

      if (response.warningMessages) {
        this.logger.warning(
          `[Jira Checker] ${response.warningMessages.join(', ')}`,
        );
        return;
      }

      const tasks = this.taskService.extractTasks(response);
      this.logger.info(`[Jira Checker] Found ${tasks.length} assigned tasks`);

      // Update UI
      this.updateIndicator(tasks);
      this.buildMenu(tasks);

      // Check for new tasks and notify
      this.checkForNewTasks(tasks);

      this.lastTasks = tasks;
    } catch (error) {
      this.logger.error(`[Jira Checker] Error checking tasks: ${error}`);
    }
  }

  private updateIndicator(tasks: JiraTask[]): void {
    // Clear existing children
    this.indicator.remove_all_children();

    // Add icon with badge container
    const iconContainer = new this.St.Widget({
      layout_manager: new this.Clutter.BinLayout(),
      reactive: false,
      can_focus: false,
      x_expand: false,
      y_expand: false,
    });

    const icon = new this.St.Icon({
      icon_name: 'dialog-information-symbolic',
      style_class: 'system-status-icon',
    });
    iconContainer.add_child(icon);

    // Add red dot badge when there are tasks
    if (tasks.length > 0) {
      const badge = new this.St.Widget({
        style:
          'background-color: #e01b24; min-width: 7px; min-height: 7px; border-radius: 999px;',
        x_align: this.Clutter.ActorAlign.END,
        y_align: this.Clutter.ActorAlign.END,
        x_expand: false,
        y_expand: false,
      });

      badge.set_translation(8, 8, 0);
      iconContainer.add_child(badge);
    }

    this.indicator.add_child(iconContainer);
  }

  private buildMenu(tasks: JiraTask[]): void {
    // Clear existing menu
    this.indicator.menu.removeAll();

    const config = this.configService.getConfig();

    // Task count label
    let taskLabel = 'No tasks assigned';
    if (tasks.length === 1) {
      taskLabel = '1 task assigned';
    } else if (tasks.length > 1) {
      taskLabel = `${tasks.length} tasks assigned`;
    }

    const headerItem = new this.PopupMenu.PopupMenuItem(taskLabel, {
      reactive: false,
    });
    this.indicator.menu.addMenuItem(headerItem);

    // Add separator
    this.indicator.menu.addMenuItem(
      new this.PopupMenu.PopupSeparatorMenuItem(),
    );

    // Add tasks
    if (tasks.length > 0) {
      tasks.forEach((task) => {
        const item = new this.PopupMenu.PopupMenuItem(task.key);
        item.connect('activate', () => {
          this.openUrl(`${config.url}/browse/${task.key}`);
        });
        this.indicator.menu.addMenuItem(item);
      });

      this.indicator.menu.addMenuItem(
        new this.PopupMenu.PopupSeparatorMenuItem(),
      );
    }

    // Open Jira button
    const openJiraItem = new this.PopupMenu.PopupMenuItem('Open Jira');
    openJiraItem.connect('activate', () => {
      this.openUrl(config.url);
    });
    this.indicator.menu.addMenuItem(openJiraItem);

    // Refresh button
    const refreshItem = new this.PopupMenu.PopupMenuItem('Refresh');
    refreshItem.connect('activate', () => {
      this.checkTasks();
    });
    this.indicator.menu.addMenuItem(refreshItem);
  }

  private checkForNewTasks(currentTasks: JiraTask[]): void {
    if (this.lastTasks.length === 0) {
      return; // First check, don't notify
    }

    const oldKeys = new Set(this.lastTasks.map((t) => t.key));
    const newTasks = currentTasks.filter((t) => !oldKeys.has(t.key));

    if (newTasks.length > 0) {
      const message =
        newTasks.length === 1
          ? `You have 1 new task: ${newTasks[0].key}`
          : `You have ${newTasks.length} new tasks`;

      this.showNotification('Jira Checker', message);

      // Call webhook if configured
      const config = this.configService.getConfig();
      if (config.webhookUrl) {
        this.callWebhook(config.webhookUrl);
      }
    }
  }

  private showNotification(title: string, message: string): void {
    this.logger.info(
      `[Jira Checker] Showing notification: ${title} - ${message}`,
    );

    this.Main.notify(title, message);
  }

  private openUrl(url: string): void {
    try {
      this.Gio.AppInfo.launch_default_for_uri(url, null);
    } catch (error) {
      this.logger.error(`[Jira Checker] Failed to open URL: ${error}`);
    }
  }

  private async callWebhook(url: string): Promise<void> {
    try {
      this.logger.info(`[Jira Checker] Calling webhook: ${url}`);

      const session = new this.Soup.Session();
      const message = this.Soup.Message.new('GET', url);
      session.send_async(message, null, null);
    } catch (error) {
      this.logger.error(`[Jira Checker] Failed to call webhook: ${error}`);
    }
  }
}
