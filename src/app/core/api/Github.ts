import { ApplicationError } from "../error/ApplicationError";
import { convertNumberZero } from "../utility/PrimaryDataUtility";

type VersionInfo = {
  major: number;
  minor: number;
  build: number;
  stage?: string;
  stageVersion?: number;
};

export type TargetVersion = {
  from: string | null;
  to: string | null;
};

export type CommitHistory = {
  sha: string;
  message: string;
  version: VersionInfo;
};

/** ============================================================
 * バージョン同士を比較する
 * @param _v1 バージョン
 * @param _v2 バージョン
 */
export function compareVersion(
  _v1: string | VersionInfo,
  _v2: string | VersionInfo
): number {
  let v1: VersionInfo;
  let v2: VersionInfo;
  if (typeof _v1 === "string") v1 = stringToVersion(_v1);
  else v1 = _v1;
  if (typeof _v2 === "string") v2 = stringToVersion(_v2);
  else v2 = _v2;
  if (v1.major < v2.major) return -1;
  if (v1.major > v2.major) return 1;
  if (v1.minor < v2.minor) return -1;
  if (v1.minor > v2.minor) return 1;
  if (v1.build < v2.build) return -1;
  if (v1.build > v2.build) return 1;
  if (v1.stage && v1.stageVersion && v2.stage && v2.stageVersion) {
    const stageOrder = ["a", "b", "rc", "s"];
    const v1StageIndex = stageOrder.findIndex(stage => stage === v1.stage);
    const v2StageIndex = stageOrder.findIndex(stage => stage === v2.stage);
    if (v1StageIndex < v2StageIndex) return -1;
    if (v1StageIndex > v2StageIndex) return 1;
    if (v1.stageVersion < v2.stageVersion) return -1;
    if (v1.stageVersion > v2.stageVersion) return 1;
  }
  if (v1.stage && v1.stageVersion && (!v2.stage || !v2.stageVersion)) {
    return -1;
  }
  if ((!v1.stage || !v1.stageVersion) && v2.stage && v2.stageVersion) {
    return 1;
  }
  return 0;
}

/** ============================================================
 * バージョンを文字列にする
 * @param v バージョン
 */
function versionToString(v: VersionInfo | null): string {
  if (!v) return "none";
  let version: string = `${v.major}.${v.minor}.${v.build}`;
  if (v.stage && v.stageVersion) version += `${v.stage}${v.stageVersion}`;
  return version;
}

/** ============================================================
 * バージョン文字列をパースする
 * @param version 文字列
 */
export function stringToVersion(version: string | null): VersionInfo {
  if (!version)
    throw new ApplicationError(`Illegal argument. version=${version}`);
  version = version.replace(/^Quoridorn /, "");
  const matchResult = version.match(
    /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:(a|b|s|rc)([0-9]+))?/
  );
  if (!matchResult)
    throw new ApplicationError(`Illegal format. str=${version}`);
  const major: number = convertNumberZero(matchResult[1]);
  const minor: number = convertNumberZero(matchResult[2]);
  const build: number = convertNumberZero(matchResult[3]);
  const stage: string = matchResult[4];
  const stageVersion: number = convertNumberZero(matchResult[5]);
  return {
    major,
    minor,
    build,
    stage,
    stageVersion
  };
}

/** ============================================================
 * GitHubのコミット履歴の一覧を取得する
 * @param repository リポジトリ名
 * @param filePath 対象ファイルのパス
 */
async function getFileCommitHistory(
  repository: string,
  filePath: string
): Promise<CommitHistory[]> {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/HillTopTRPG/${repository}/commits?q=Ver+sort%3Aauthor-date&path=${filePath}`;
    fetch(url)
      .then((response: any) => response.json())
      .then((commitHistoryList: any[]) => {
        const resultList: CommitHistory[] = [];
        commitHistoryList.forEach((commitHistory: any) => {
          const sha: string = commitHistory.sha;
          const message: string = commitHistory.commit.message;
          const matchResult = message.match(
            /^Ver\.?(([0-9]+)\.([0-9]+)\.([0-9]+)([a-z][0-9]+)?)/
          );
          if (!matchResult) return;
          const version = stringToVersion(matchResult[1]);
          if (!version) return;
          resultList.push({
            sha,
            message,
            version
          });
        });
        resolve(resultList);
      })
      .catch((reason: any) => {
        reject(reason);
      });
  });
}

/** ============================================================
 * GitHubから特定のリビジョンの特定のファイルの内容を取得する
 * @param repository リポジトリ
 * @param filePath 対象ファイルのパス
 * @param sha リビジョンの指定
 */
async function getRevisionFileRow(
  repository: string,
  filePath: string,
  sha: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/HillTopTRPG/${repository}/${sha}/${filePath}`;
    fetch(url)
      .then((response: any) => response.text())
      .then((row: string) => {
        resolve(row);
      })
      .catch((reason: any) => {
        reject(reason);
      });
  });
}

/** ============================================================
 * GitHubから特定のファイルの最新の内容を取得する
 * @param repository リポジトリ
 * @param filePath 対象ファイルのパス
 */
export async function getFileRow(
  repository: string,
  filePath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/HillTopTRPG/${repository}/master/${filePath}`;
    fetch(url)
      .then((response: any) => response.text())
      .then((row: string) => {
        resolve(row);
      })
      .catch((reason: any) => {
        reject(reason);
      });
  });
}
