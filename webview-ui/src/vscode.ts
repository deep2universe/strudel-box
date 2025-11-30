/**
 * VS Code API Wrapper for Webview
 */

interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

let vscodeApi: VSCodeAPI | undefined;

export function getVSCodeAPI(): VSCodeAPI {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}

export function postMessage(command: string, payload?: unknown): void {
  getVSCodeAPI().postMessage({ command, payload });
}

export function saveState(state: unknown): void {
  getVSCodeAPI().setState(state);
}

export function getState<T>(): T | undefined {
  return getVSCodeAPI().getState() as T | undefined;
}
