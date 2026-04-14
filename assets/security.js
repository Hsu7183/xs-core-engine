const AUTH_CONFIG = {
    salt: "xs-core-engine-home-v1",
    derivedHex: "44ac04239a3f1e8187579d1f0fb09958f1e295c384a4260f9d6419f697e17fa6",
    iterations: 600000,
    sessionTtlMs: 20 * 60 * 1000,
    maxFailedAttempts: 5,
    cooldownMs: 5 * 60 * 1000,
    sessionKey: "xs-home-auth-v1",
    lockKey: "xs-home-lock-v1",
};

function safeStorageGet(storage, key) {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

function safeStorageSet(storage, key, value) {
    try {
        storage.setItem(key, value);
    } catch {
        // ignore storage failures
    }
}

function safeStorageRemove(storage, key) {
    try {
        storage.removeItem(key);
    } catch {
        // ignore storage failures
    }
}

function readJson(storage, key) {
    const raw = safeStorageGet(storage, key);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        safeStorageRemove(storage, key);
        return null;
    }
}

function writeJson(storage, key, value) {
    safeStorageSet(storage, key, JSON.stringify(value));
}

function formatDuration(ms) {
    const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes <= 0) {
        return `${seconds} 秒`;
    }

    return `${minutes} 分 ${String(seconds).padStart(2, "0")} 秒`;
}

function setStatusMessage(element, message, tone = "info") {
    element.textContent = message;
    element.classList.remove("is-success", "is-warning", "is-error");

    if (tone === "success") {
        element.classList.add("is-success");
    } else if (tone === "warning") {
        element.classList.add("is-warning");
    } else if (tone === "error") {
        element.classList.add("is-error");
    }
}

function constantTimeEqual(left, right) {
    if (left.length !== right.length) {
        return false;
    }

    let diff = 0;
    for (let index = 0; index < left.length; index += 1) {
        diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }

    return diff === 0;
}

function hexFromBuffer(buffer) {
    return [...new Uint8Array(buffer)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function derivePasswordHex(password) {
    if (!window.crypto?.subtle) {
        throw new Error("目前瀏覽器無法使用安全加密。請改用 HTTPS、localhost，或支援 Web Crypto 的環境開啟。");
    }

    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
    );

    const bits = await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: encoder.encode(AUTH_CONFIG.salt),
            iterations: AUTH_CONFIG.iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        256,
    );

    return hexFromBuffer(bits);
}

function readLockState() {
    const state = readJson(window.localStorage, AUTH_CONFIG.lockKey) ?? {
        failedAttempts: 0,
        cooldownUntil: 0,
    };

    if (Number(state.cooldownUntil ?? 0) > 0 && Number(state.cooldownUntil) <= Date.now()) {
        resetLockState();
        return {
            failedAttempts: 0,
            cooldownUntil: 0,
        };
    }

    return state;
}

function writeLockState(state) {
    writeJson(window.localStorage, AUTH_CONFIG.lockKey, state);
}

function resetLockState() {
    safeStorageRemove(window.localStorage, AUTH_CONFIG.lockKey);
}

function getCooldownRemainingMs() {
    const state = readLockState();
    return Math.max(0, Number(state.cooldownUntil ?? 0) - Date.now());
}

function registerFailedAttempt() {
    const state = readLockState();
    const failedAttempts = Number(state.failedAttempts ?? 0) + 1;
    const nextState = {
        failedAttempts,
        cooldownUntil: failedAttempts >= AUTH_CONFIG.maxFailedAttempts
            ? Date.now() + AUTH_CONFIG.cooldownMs
            : 0,
    };

    writeLockState(nextState);
    return nextState;
}

function createSessionState() {
    return {
        unlocked: true,
        expiresAt: Date.now() + AUTH_CONFIG.sessionTtlMs,
    };
}

function readSessionState() {
    const state = readJson(window.sessionStorage, AUTH_CONFIG.sessionKey);
    if (!state || !state.unlocked) {
        return null;
    }

    if (Number(state.expiresAt ?? 0) <= Date.now()) {
        safeStorageRemove(window.sessionStorage, AUTH_CONFIG.sessionKey);
        return null;
    }

    return state;
}

function writeSessionState(state) {
    writeJson(window.sessionStorage, AUTH_CONFIG.sessionKey, state);
}

function refreshSessionState() {
    if (!readSessionState()) {
        return;
    }

    writeSessionState(createSessionState());
}

function breakOutOfFrames() {
    if (window.top === window.self) {
        return;
    }

    try {
        window.top.location = window.self.location.href;
    } catch {
        document.body.textContent = "已阻擋內嵌開啟。";
        throw new Error("已阻擋內嵌開啟");
    }
}

function consumePasswordFromQuery() {
    try {
        const url = new URL(window.location.href);
        const password = url.searchParams.get("password") ?? "";
        if (!password) {
            return "";
        }

        url.searchParams.delete("password");
        const nextSearch = url.searchParams.toString();
        const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
        window.history.replaceState({}, document.title, nextUrl);
        return password;
    } catch {
        return "";
    }
}

export function initializeAccessControl() {
    const gateEl = document.getElementById("security-gate");
    const appShellEl = document.getElementById("app-shell");
    const unlockForm = document.getElementById("unlock-form");
    const unlockPasswordEl = document.getElementById("unlock-password");
    const unlockSubmitEl = document.getElementById("unlock-submit");
    const unlockStatusEl = document.getElementById("unlock-status");
    const lockWorkspaceEl = document.getElementById("lock-workspace");
    const securityNoteEl = document.getElementById("security-note");

    let sessionTimerId = null;

    function updateSecurityNote() {
        const cooldownMs = getCooldownRemainingMs();
        if (cooldownMs > 0) {
            securityNoteEl.textContent = `受保護的靜態工作區。由於連續輸入失敗，目前冷卻中，請在 ${formatDuration(cooldownMs)} 後再試。`;
            return;
        }

        if (readSessionState()) {
            securityNoteEl.textContent = "受保護的靜態工作區。這個分頁目前已解鎖；若未來要公開上線，仍建議加上 HTTPS 與真正的邊緣端存取控制。";
            return;
        }

        securityNoteEl.textContent = "受保護的靜態工作區。若未來要公開上線，仍建議加上 HTTPS 與真正的邊緣端存取控制。";
    }

    function setPageLocked(locked) {
        document.body.classList.toggle("is-locked", locked);
        gateEl.hidden = !locked;

        if (locked) {
            appShellEl.setAttribute("inert", "");
            unlockPasswordEl.focus();
        } else {
            appShellEl.removeAttribute("inert");
        }
    }

    function updateGateStatusFromLockState() {
        const cooldownMs = getCooldownRemainingMs();
        if (cooldownMs > 0) {
            unlockSubmitEl.disabled = true;
            setStatusMessage(unlockStatusEl, `嘗試次數過多，請在 ${formatDuration(cooldownMs)} 後再試。`, "warning");
            return;
        }

        unlockSubmitEl.disabled = false;
        setStatusMessage(unlockStatusEl, "請輸入工作區密碼。");
    }

    function startSessionWatch() {
        if (sessionTimerId !== null) {
            clearInterval(sessionTimerId);
        }

        sessionTimerId = window.setInterval(() => {
            if (!readSessionState()) {
                setPageLocked(true);
                updateGateStatusFromLockState();
            }
            updateSecurityNote();
        }, 10000);
    }

    function onTrustedActivity() {
        if (readSessionState()) {
            refreshSessionState();
            updateSecurityNote();
        }
    }

    async function attemptUnlock(password, { clearInputOnSuccess = true } = {}) {
        const cooldownMs = getCooldownRemainingMs();
        if (cooldownMs > 0) {
            updateGateStatusFromLockState();
            updateSecurityNote();
            return false;
        }

        if (!password) {
            setStatusMessage(unlockStatusEl, "密碼不能為空。", "error");
            unlockPasswordEl.focus();
            return false;
        }

        unlockSubmitEl.disabled = true;
        setStatusMessage(unlockStatusEl, "正在驗證密碼...", "warning");

        try {
            const derivedHex = await derivePasswordHex(password);
            const allowed = constantTimeEqual(derivedHex, AUTH_CONFIG.derivedHex);

            if (!allowed) {
                const state = registerFailedAttempt();
                unlockPasswordEl.value = "";

                if (Number(state.cooldownUntil) > Date.now()) {
                    setStatusMessage(
                        unlockStatusEl,
                        `密碼錯誤，已進入冷卻，請在 ${formatDuration(Number(state.cooldownUntil) - Date.now())} 後再試。`,
                        "warning",
                    );
                } else {
                    const remaining = Math.max(0, AUTH_CONFIG.maxFailedAttempts - Number(state.failedAttempts));
                    setStatusMessage(
                        unlockStatusEl,
                        remaining > 0
                            ? `密碼錯誤。距離冷卻還剩 ${remaining} 次嘗試。`
                            : "密碼錯誤。",
                        "error",
                    );
                }

                updateSecurityNote();
                unlockSubmitEl.disabled = getCooldownRemainingMs() > 0;
                return false;
            }

            resetLockState();
            writeSessionState(createSessionState());
            if (clearInputOnSuccess) {
                unlockPasswordEl.value = "";
            }
            setPageLocked(false);
            setStatusMessage(unlockStatusEl, "工作區已解鎖。", "success");
            updateSecurityNote();
            return true;
        } catch (error) {
            setStatusMessage(unlockStatusEl, String(error.message ?? error), "error");
            return false;
        } finally {
            if (!document.body.classList.contains("is-locked")) {
                unlockSubmitEl.disabled = false;
            } else {
                updateGateStatusFromLockState();
            }
        }
    }

    breakOutOfFrames();
    updateSecurityNote();

    const queryPassword = consumePasswordFromQuery();
    if (queryPassword) {
        unlockPasswordEl.value = queryPassword;
    }

    if (readSessionState()) {
        setPageLocked(false);
    } else {
        setPageLocked(true);
        updateGateStatusFromLockState();
    }

    startSessionWatch();

    ["pointerdown", "keydown"].forEach((eventName) => {
        window.addEventListener(eventName, onTrustedActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", onTrustedActivity);

    unlockForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await attemptUnlock(unlockPasswordEl.value);
    });

    lockWorkspaceEl.addEventListener("click", () => {
        safeStorageRemove(window.sessionStorage, AUTH_CONFIG.sessionKey);
        setPageLocked(true);
        updateGateStatusFromLockState();
        updateSecurityNote();
    });

    if (queryPassword && !readSessionState() && getCooldownRemainingMs() <= 0) {
        window.setTimeout(() => {
            void attemptUnlock(queryPassword, { clearInputOnSuccess: false });
        }, 0);
    }
}
