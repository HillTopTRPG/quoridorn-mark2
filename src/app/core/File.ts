import yaml from "js-yaml";

export async function loadYaml<T>(yamlPath: string): Promise<any> {
  return new Promise(
    (resolve: (data: T) => void, reject: (reason?: any) => void) => {
      window
        .fetch(process.env.BASE_URL + yamlPath)
        .then((response: any) => response.text())
        .then((text: string) => yaml.safeLoad(text))
        .then((data: T) => {
          resolve(data);
        })
        .catch((reason?: any) => {
          window.console.log("yamlファイルの読み込みに失敗しました", yamlPath);
          reject(reason);
        });
    }
  );
}

export async function loadJson<T>(jsonPath: string): Promise<any> {
  return new Promise(
    (resolve: (data: T) => void, reject: (reason?: any) => void) => {
      window
        .fetch(process.env.BASE_URL + jsonPath)
        .then(response => response.text())
        .then(text => JSON.parse(text))
        .then((data: T) => {
          resolve(data);
        })
        .catch((reason?: any) => {
          window.console.log("jsonファイルの読み込みに失敗しました", jsonPath);
          reject(reason);
        });
    }
  );
}

export async function loadText(textPath: string): Promise<string> {
  return new Promise(
    (resolve: (data: string) => void, reject: (reason?: any) => void) => {
      window
        .fetch(process.env.BASE_URL + textPath)
        .then(async response => resolve(await response.text()))
        .catch((reason?: any) => {
          window.console.log("textファイルの読み込みに失敗しました", textPath);
          reject(reason);
        });
    }
  );
}
