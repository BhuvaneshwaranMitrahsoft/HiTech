import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const GITHUB_CONFIG_KEY = 'hitech_github_publish_config';

export interface GithubPublishConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface PublishFile {
  path: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogPublishService {
  private http = inject(HttpClient);

  getConfig(): GithubPublishConfig {
    const defaults: GithubPublishConfig = {
      owner: environment.github.owner,
      repo: environment.github.repo,
      branch: environment.github.branch,
      token: ''
    };
    try {
      const saved = localStorage.getItem(GITHUB_CONFIG_KEY);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {}
    return defaults;
  }

  saveConfig(config: Partial<GithubPublishConfig>): void {
    const merged = { ...this.getConfig(), ...config };
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(merged));
  }

  isConfigured(): boolean {
    const cfg = this.getConfig();
    return !!cfg.token && !!cfg.owner && !!cfg.repo && !!cfg.branch;
  }

  private toBase64(text: string): string {
    return btoa(unescape(encodeURIComponent(text)));
  }

  async publishFiles(files: PublishFile[], commitMessage: string): Promise<{ success: boolean; message: string }> {
    const cfg = this.getConfig();
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'GitHub token is not set. Download or email JSON instead, then commit the files.'
      };
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    });

    try {
      for (const file of files) {
        const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${file.path}`;
        let sha: string | undefined;
        try {
          const existing = await firstValueFrom(
            this.http.get<{ sha: string }>(apiUrl, { headers, params: { ref: cfg.branch } })
          );
          sha = existing.sha;
        } catch {
          sha = undefined;
        }

        await firstValueFrom(
          this.http.put(apiUrl, {
            message: commitMessage,
            content: this.toBase64(file.content),
            branch: cfg.branch,
            sha
          }, { headers })
        );
      }

      return {
        success: true,
        message: `Published ${files.length} catalog files to ${cfg.owner}/${cfg.repo} (${cfg.branch}). Render will update after GitHub Actions deploy.`
      };
    } catch (err: any) {
      const detail = err?.error?.message || err?.message || 'GitHub publish failed';
      return { success: false, message: detail };
    }
  }
}
