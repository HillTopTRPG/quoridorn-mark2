import { ApplicationError } from "@/app/core/error/ApplicationError";

type VersionInfo = {
  major: number;
  minor: number;
  build: number;
  stage?: string;
  stageVersion?: number;
};

export async function getCurrentVersionSource(
  repository: string,
  filePath: string,
  version: string
): Promise<{ commit: CommitHistory; row: string }[]> {
  const versionInfo = stringToVersion(version);

  let targetCommitList: CommitHistory[] = [];
  const commitHistoryList: CommitHistory[] = await getFileCommitHistory(
    repository,
    filePath
  );
  for (const history of commitHistoryList) {
    const compResult = compareVersion(versionInfo, history.version);
    targetCommitList.push(history);
    if (compResult >= 0) break;
  }
  if (!targetCommitList.length) {
    throw new ApplicationError(
      `Illegal client version. ${versionToString(versionInfo)}`
    );
  }

  const resultList: { commit: CommitHistory; row: string }[] = [];
  const func = async (commit: CommitHistory): Promise<void> => {
    const row = await getRevisionFileRow(repository, filePath, commit.sha);
    resultList.push({
      commit,
      row
    });
  };

  // funcを直列の非同期で全部実行する
  await targetCommitList
    .map((commit: CommitHistory) => () => func(commit))
    .reduce((prev, curr) => prev.then(curr), Promise.resolve());

  // window.console.log(`target: ${versionToString(targetCommit.version)}`);
  return resultList;
}

export async function getVersionMapping(
  clientVersionStr: string,
  serverVersionStr: string
) {
  const clientVersion = stringToVersion(clientVersionStr);
  const serverVersion = stringToVersion(serverVersionStr);

  const clientHistoryList = await getCommitHistoryWithRequireVersion(
    "quoridorn-mark2",
    ".env",
    clientVersionStr,
    "VUE_APP_REQUIRE_SERVER_VERSION"
  );
  const serverHistoryList = await getCommitHistoryWithRequireVersion(
    "quoridorn-server",
    ".env",
    serverVersionStr,
    "REQUIRE_CLIENT_VERSION"
  );

  // どっちが先かを判断
  const firstClientRequireResult = compareVersion(
    clientHistoryList[0].requireVersion,
    serverHistoryList[0].version
  );
}

function getPropertyValue(row: string, property: string) {
  const propMap: any = {};
  row.split("\n").forEach(line => {
    const matchResult = line.match(/([0-9a-zA-Z_]) *= *"([^"]+)"/);
    if (!matchResult) return;
    propMap[matchResult[1]] = matchResult[2];
  });
  return propMap[property];
}

async function getCommitHistoryWithRequireVersion(
  repository: string,
  filePath: string,
  currentVersionStr: string,
  requireVersionProperty: string
): Promise<CommitHistoryWithRequireVersion[]> {
  const currentVersion = stringToVersion(currentVersionStr);
  const commitHistoryList: CommitHistory[] = await getFileCommitHistory(
    repository,
    filePath
  );
  let isFindCurrent = false;
  const resultList: CommitHistoryWithRequireVersion[] = [];
  const func = async (commit: CommitHistory): Promise<void> => {
    const row = await getRevisionFileRow(repository, filePath, commit.sha);
    const requireVersion = stringToVersion(
      getPropertyValue(row, requireVersionProperty)
    );

    const resultInfo: CommitHistoryWithRequireVersion = {
      ...commit,
      requireVersion,
      isCurrent: false,
      isSkip: false,
      rangeOutFlg: 0
    };
    if (
      resultList.length &&
      compareVersion(
        resultList[resultList.length - 1].requireVersion,
        requireVersion
      ) === 0
    ) {
      resultList[resultList.length - 1].isSkip = true;
    }
    if (!isFindCurrent) {
      resultInfo.isCurrent = isFindCurrent =
        compareVersion(currentVersion, resultInfo.version) === 0;
    }
    resultList.push(resultInfo);
  };

  // 直列の非同期で全部実行する
  await commitHistoryList
    .map(commit => () => func(commit))
    .reduce((prev, curr) => prev.then(curr), Promise.resolve());

  if (!isFindCurrent) {
    resultList.push({
      isSkip: false,
      isCurrent: true,
      message: "",
      sha: "",
      version: currentVersion,
      requireVersion: {
        major: 0,
        minor: 0,
        build: 0
      },
      rangeOutFlg: 1
    });
  }

  return resultList;
}

/** ============================================================
 * バージョン同士を比較する
 * @param v1 バージョン
 * @param v2 バージョン
 */
export function compareVersion(v1: VersionInfo, v2: VersionInfo): number {
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
  const matchResult = version.match(
    /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:(a|b|s|rc)([0-9]+))?/
  );
  if (!matchResult)
    throw new ApplicationError(`Illegal format. str=${version}`);
  const major: number = parseInt(matchResult[1], 10);
  const minor: number = parseInt(matchResult[2], 10);
  const build: number = parseInt(matchResult[3], 10);
  const stage: string = matchResult[4];
  const stageVersion: number = parseInt(matchResult[5], 10);
  return {
    major,
    minor,
    build,
    stage,
    stageVersion
  };
}

export type CommitHistory = {
  sha: string;
  message: string;
  version: VersionInfo;
};

type CommitHistoryWithRequireVersion = CommitHistory & {
  requireVersion: VersionInfo;
  isCurrent: boolean;
  isSkip: boolean;
  rangeOutFlg: number;
};

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
