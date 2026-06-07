const DROPBOX_AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DATA_FILE_PATH = "/workout-data.json";

const STORAGE = {
  appKey: "trainingBookDropboxAppKey",
  verifier: "trainingBookDropboxVerifier",
  state: "trainingBookDropboxState",
  accessToken: "trainingBookDropboxAccessToken",
  accessTokenExpiresAt: "trainingBookDropboxAccessTokenExpiresAt",
  refreshToken: "trainingBookDropboxRefreshToken",
  localData: "trainingBookWorkoutData",
  pendingData: "trainingBookPendingWorkoutData",
  deviceId: "trainingBookDeviceId"
};

const screens = Array.from(document.querySelectorAll(".screen"));
const tabs = Array.from(document.querySelectorAll(".tab"));
const dateLabel = document.querySelector("#today-date");
const syncPill = document.querySelector("#sync-pill");
const connectionBadge = document.querySelector("#connection-badge");
const appKeyInput = document.querySelector("#dropbox-app-key");
const connectButton = document.querySelector("#connect-dropbox");
const forgetButton = document.querySelector("#forget-dropbox");
const testEntryInput = document.querySelector("#test-entry");
const saveTestEntryButton = document.querySelector("#save-test-entry");
const loadWorkoutDataButton = document.querySelector("#load-workout-data");
const syncPendingButton = document.querySelector("#sync-pending");
const syncStatus = document.querySelector("#sync-status");
const savedTestEntries = document.querySelector("#saved-test-entries");

if (dateLabel) {
  dateLabel.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date());
}

const savedAppKey = localStorage.getItem(STORAGE.appKey);
if (savedAppKey && appKeyInput) {
  appKeyInput.value = savedAppKey;
}

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });

  tabs.forEach((tab) => {
    const isActive = tab.dataset.target === name;
    tab.classList.toggle("is-active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
}

function setSyncStatus(message, tone = "") {
  if (!syncStatus) return;
  syncStatus.textContent = message;
  syncStatus.className = tone ? `sync-status ${tone}` : "sync-status";
}

function setConnectionUi(message, tone = "") {
  if (connectionBadge) {
    connectionBadge.textContent = message;
    connectionBadge.className = tone ? `connection-badge ${tone}` : "connection-badge";
  }

  if (syncPill) {
    syncPill.className = tone ? `sync-pill ${tone}` : "sync-pill";
    syncPill.lastChild.textContent = message;
  }
}

function getRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function getDeviceId() {
  let deviceId = localStorage.getItem(STORAGE.deviceId);
  if (!deviceId) {
    deviceId = `device-${randomString(10)}`;
    localStorage.setItem(STORAGE.deviceId, deviceId);
  }
  return deviceId;
}

function randomString(length = 64) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => possible[value % possible.length]).join("");
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return crypto.subtle.digest("SHA-256", data);
}

function makeEmptyData() {
  return {
    schemaVersion: 1,
    appName: "Training Book",
    updatedAt: null,
    updatedBy: getDeviceId(),
    testEntries: [],
    workouts: []
  };
}

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getLocalData() {
  return readJson(STORAGE.localData) || makeEmptyData();
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE.localData, JSON.stringify(data));
  renderTestEntries(data);
}

function markPendingData(data) {
  localStorage.setItem(STORAGE.pendingData, JSON.stringify(data));
  updateConnectionState();
}

function clearPendingData() {
  localStorage.removeItem(STORAGE.pendingData);
  updateConnectionState();
}

function hasPendingData() {
  return Boolean(localStorage.getItem(STORAGE.pendingData));
}

function renderTestEntries(data = getLocalData()) {
  if (!savedTestEntries) return;

  const entries = Array.isArray(data.testEntries) ? data.testEntries.slice().reverse() : [];
  if (entries.length === 0) {
    savedTestEntries.innerHTML = '<p class="empty-list">No test entries yet.</p>';
    return;
  }

  savedTestEntries.innerHTML = entries.map((entry) => {
    const date = entry.createdAt
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }).format(new Date(entry.createdAt))
      : "Unknown time";

    return `
      <article class="saved-entry">
        <p>${escapeHtml(entry.note || "Untitled test entry")}</p>
        <span>${date}</span>
      </article>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStoredAccessToken() {
  const token = localStorage.getItem(STORAGE.accessToken);
  const expiresAt = Number(localStorage.getItem(STORAGE.accessTokenExpiresAt) || 0);
  if (!token || Date.now() > expiresAt - 60000) return null;
  return token;
}

function storeTokenInfo(tokenInfo) {
  if (tokenInfo.access_token) {
    localStorage.setItem(STORAGE.accessToken, tokenInfo.access_token);
    const expiresIn = Number(tokenInfo.expires_in || 14400);
    localStorage.setItem(STORAGE.accessTokenExpiresAt, String(Date.now() + expiresIn * 1000));
  }

  if (tokenInfo.refresh_token) {
    localStorage.setItem(STORAGE.refreshToken, tokenInfo.refresh_token);
  }
}

async function getAccessToken() {
  const currentToken = getStoredAccessToken();
  if (currentToken) return currentToken;

  const refreshToken = localStorage.getItem(STORAGE.refreshToken);
  const appKey = localStorage.getItem(STORAGE.appKey);
  if (!refreshToken || !appKey) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: appKey
  });

  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Dropbox connection expired. Tap Forget, then Connect again.");
  }

  const tokenInfo = await response.json();
  storeTokenInfo(tokenInfo);
  return tokenInfo.access_token;
}

async function startDropboxConnect() {
  const appKey = appKeyInput?.value.trim();
  if (!appKey) {
    setSyncStatus("Paste the Dropbox app key first.", "warn");
    appKeyInput?.focus();
    return;
  }

  localStorage.setItem(STORAGE.appKey, appKey);
  const verifier = randomString();
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = randomString(24);

  sessionStorage.setItem(STORAGE.verifier, verifier);
  sessionStorage.setItem(STORAGE.state, state);

  const params = new URLSearchParams({
    client_id: appKey,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    token_access_type: "offline",
    state
  });

  window.location.href = `${DROPBOX_AUTHORIZE_URL}?${params.toString()}`;
}

async function finishDropboxConnect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error_description") || params.get("error");

  if (error) {
    setSyncStatus(`Dropbox connection did not finish: ${error}`, "bad");
    return;
  }

  if (!code) {
    updateConnectionState();
    return;
  }

  const expectedState = sessionStorage.getItem(STORAGE.state);
  const verifier = sessionStorage.getItem(STORAGE.verifier);
  const appKey = localStorage.getItem(STORAGE.appKey);

  if (!expectedState || !verifier || state !== expectedState || !appKey) {
    setSyncStatus("Dropbox sent us back, but the saved connection details were missing. Try Connect again.", "bad");
    return;
  }

  setSyncStatus("Finishing Dropbox connection...");
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: appKey,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier
  });

  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Dropbox connection failed: ${message}`);
  }

  const tokenInfo = await response.json();
  storeTokenInfo(tokenInfo);
  sessionStorage.removeItem(STORAGE.verifier);
  sessionStorage.removeItem(STORAGE.state);
  window.history.replaceState({}, document.title, getRedirectUri());
  setSyncStatus("Connected to Dropbox. Loading workout data...");
  updateConnectionState();
  await loadWorkoutData();
}

async function uploadWorkoutData(data) {
  const token = await getAccessToken();
  if (!token) throw new Error("Connect Dropbox before syncing.");

  const response = await fetch(DROPBOX_UPLOAD_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: DATA_FILE_PATH,
        mode: "overwrite",
        autorename: false,
        mute: false,
        strict_conflict: false
      })
    },
    body: JSON.stringify(data, null, 2)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Dropbox save failed: ${message}`);
  }
}

async function downloadWorkoutData() {
  const token = await getAccessToken();
  if (!token) throw new Error("Connect Dropbox before loading.");

  const response = await fetch(DROPBOX_DOWNLOAD_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path: DATA_FILE_PATH })
    }
  });

  if (response.status === 409) {
    return makeEmptyData();
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Dropbox load failed: ${message}`);
  }

  return response.json();
}

async function saveTestEntry() {
  const note = testEntryInput?.value.trim();
  if (!note) {
    setSyncStatus("Type a short test note first.", "warn");
    testEntryInput?.focus();
    return;
  }

  const data = getLocalData();
  const savedAt = new Date().toISOString();
  data.updatedAt = savedAt;
  data.updatedBy = getDeviceId();
  data.testEntries = Array.isArray(data.testEntries) ? data.testEntries : [];
  data.testEntries.push({
    id: `test-${Date.now()}-${randomString(6)}`,
    note,
    createdAt: savedAt,
    createdBy: getDeviceId()
  });

  saveLocalData(data);
  testEntryInput.value = "";
  markPendingData(data);

  if (!navigator.onLine) {
    setSyncStatus("Saved on this device. It will sync when internet is back.", "warn");
    return;
  }

  try {
    await uploadWorkoutData(data);
    clearPendingData();
    setSyncStatus("Saved to Dropbox and kept a local backup.", "good");
  } catch (error) {
    setSyncStatus(`${error.message} Saved locally for now.`, "warn");
  }
}

async function loadWorkoutData() {
  if (!navigator.onLine) {
    setSyncStatus("Offline right now. Showing the local backup on this device.", "warn");
    renderTestEntries();
    return;
  }

  const data = await downloadWorkoutData();
  saveLocalData(data);
  setSyncStatus("Loaded the latest workout data from Dropbox.", "good");
  updateConnectionState();
}

async function syncPendingData() {
  const pendingData = readJson(STORAGE.pendingData);
  if (!pendingData) {
    setSyncStatus("Nothing pending. This device is caught up.", "good");
    return;
  }

  if (!navigator.onLine) {
    setSyncStatus("Still offline. Pending data is safe on this device.", "warn");
    return;
  }

  await uploadWorkoutData(pendingData);
  clearPendingData();
  setSyncStatus("Pending data synced to Dropbox.", "good");
}

function forgetDropbox() {
  [
    STORAGE.appKey,
    STORAGE.accessToken,
    STORAGE.accessTokenExpiresAt,
    STORAGE.refreshToken
  ].forEach((key) => localStorage.removeItem(key));

  sessionStorage.removeItem(STORAGE.verifier);
  sessionStorage.removeItem(STORAGE.state);
  if (appKeyInput) appKeyInput.value = "";
  updateConnectionState();
  setSyncStatus("Dropbox connection forgotten on this device. Local backup remains.", "warn");
}

function updateConnectionState() {
  const hasDropbox = Boolean(localStorage.getItem(STORAGE.refreshToken) || getStoredAccessToken());
  if (!navigator.onLine) {
    setConnectionUi(hasPendingData() ? "Offline, pending" : "Offline", "warn");
    return;
  }

  if (hasPendingData()) {
    setConnectionUi("Pending sync", "warn");
  } else if (hasDropbox) {
    setConnectionUi("Dropbox ready", "good");
  } else {
    setConnectionUi("Local only");
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showScreen(tab.dataset.target);
  });
});

connectButton?.addEventListener("click", () => {
  startDropboxConnect().catch((error) => {
    setSyncStatus(error.message, "bad");
  });
});

forgetButton?.addEventListener("click", forgetDropbox);

saveTestEntryButton?.addEventListener("click", () => {
  saveTestEntry().catch((error) => {
    setSyncStatus(error.message, "bad");
  });
});

loadWorkoutDataButton?.addEventListener("click", () => {
  loadWorkoutData().catch((error) => {
    setSyncStatus(error.message, "bad");
  });
});

syncPendingButton?.addEventListener("click", () => {
  syncPendingData().catch((error) => {
    setSyncStatus(error.message, "bad");
  });
});

window.addEventListener("online", () => {
  updateConnectionState();
  syncPendingData().catch(() => {
    setSyncStatus("Back online. Tap Sync pending when ready.", "warn");
  });
});

window.addEventListener("offline", updateConnectionState);

renderTestEntries();
finishDropboxConnect().catch((error) => {
  setSyncStatus(error.message, "bad");
  updateConnectionState();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The shell still works if a browser skips service workers.
    });
  });
}
