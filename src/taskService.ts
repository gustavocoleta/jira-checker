// Task service for fetching Jira tasks
import { JiraConfig, JiraSearchResponse, JiraTask } from './types';

export class TaskService {
  private readonly Soup: any;
  private readonly GLib: any;

  constructor(Soup: any, GLib: any) {
    this.Soup = Soup;
    this.GLib = GLib;
  }

  public async getTasks(config: JiraConfig): Promise<JiraSearchResponse> {
    return new Promise((resolve, reject) => {
      try {
        const jql = `assignee = "${config.email}" AND resolution IS EMPTY`;
        const encodedJql = encodeURIComponent(jql);
        const url = `${config.url}/rest/api/3/search/jql?jql=${encodedJql}&fields=key`;

        const session = new this.Soup.Session();
        const message = this.Soup.Message.new('GET', url);

        console.log(`[Jira Checker] Fetching tasks from: ${url}`);

        console.log('[Jira Checker] Sending request to Jira API');

        // Set headers
        message.request_headers.append('Authorization', `Basic ${config.auth}`);
        message.request_headers.append('Accept', 'application/json');
        message.request_headers.append('Content-Type', 'application/json');

        session.send_and_read_async(
          message,
          this.GLib.PRIORITY_DEFAULT,
          null,
          (session: any, result: any) => {
            try {
              const bytes = session.send_and_read_finish(result);
              const decoder = new TextDecoder('utf-8');
              const response = decoder.decode(bytes.get_data());

              const data = JSON.parse(response);
              resolve(data);
            } catch (error) {
              reject(error);
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  public extractTasks(response: JiraSearchResponse): JiraTask[] {
    if (response.errorMessages || response.warningMessages) {
      return [];
    }

    return response.issues.map((issue) => ({
      id: issue.id,
      key: issue.key,
    }));
  }
}
