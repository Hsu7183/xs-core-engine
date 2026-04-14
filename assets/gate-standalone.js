(function () {
    const AUTH_CONFIG = {
        salt: "xs-core-engine-home-v1",
        derivedHex: "44ac04239a3f1e8187579d1f0fb09958f1e295c384a4260f9d6419f697e17fa6",
        iterations: 600000,
        sessionTtlMs: 20 * 60 * 1000,
        maxFailedAttempts: 5,
        cooldownMs: 5 * 60 * 1000,
        sessionKey: "xs-home-auth-v1",
        lockKey: "xs-home-lock-v1",
        versionKey: "xs-home-gate-version",
        policyVersion: "gate-standalone-v2",
    };

    const DEVTOOLS_THRESHOLD = 160;
    const DEBUGGER_THRESHOLD_MS = 150;
    const DEBUGGER_PROBE_INTERVAL_MS = 2000;
    const DETECTION_MESSAGE = "操作已停用";

    const gateLayer = document.getElementById("gate-layer");
    const unlockForm = document.getElementById("unlock-form");
    const unlockPassword = document.getElementById("unlock-password");
    const unlockStatus = document.getElementById("unlock-status");
    const unlockSubmit = document.getElementById("unlock-submit");
    const workspace = document.getElementById("workspace");
    const lockWorkspaceButton = document.getElementById("lock-workspace");

    let debuggerProbeId = 0;
    let trippedByDevtools = false;

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

    function setStatus(message) {
        unlockStatus.textContent = message || "";
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
        return Array.from(new Uint8Array(buffer), (byte) =>
            byte.toString(16).padStart(2, "0"),
        ).join("");
    }

    async function derivePasswordHex(password) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("瀏覽器不支援目前驗證方式");
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

    function resetLockState() {
        safeStorageRemove(window.localStorage, AUTH_CONFIG.lockKey);
    }

    function readLockState() {
        const state = readJson(window.localStorage, AUTH_CONFIG.lockKey) || {
            failedAttempts: 0,
            cooldownUntil: 0,
        };

        if (
            Number(state.cooldownUntil || 0) > 0 &&
            Number(state.cooldownUntil || 0) <= Date.now()
        ) {
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

    function getCooldownRemainingMs() {
        const state = readLockState();
        return Math.max(0, Number(state.cooldownUntil || 0) - Date.now());
    }

    function formatDuration(ms) {
        const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes <= 0) {
            return seconds + " 秒";
        }

        return minutes + " 分 " + String(seconds).padStart(2, "0") + " 秒";
    }

    function registerFailedAttempt() {
        const current = readLockState();
        const failedAttempts = Number(current.failedAttempts || 0) + 1;
        const nextState = {
            failedAttempts: failedAttempts,
            cooldownUntil:
                failedAttempts >= AUTH_CONFIG.maxFailedAttempts
                    ? Date.now() + AUTH_CONFIG.cooldownMs
                    : 0,
        };

        writeLockState(nextState);
        return nextState;
    }

    function clearSession() {
        safeStorageRemove(window.sessionStorage, AUTH_CONFIG.sessionKey);
    }

    function writeSession() {
        writeJson(window.sessionStorage, AUTH_CONFIG.sessionKey, {
            expiresAt: Date.now() + AUTH_CONFIG.sessionTtlMs,
        });
    }

    function resetLegacyStateIfNeeded() {
        const savedVersion = safeStorageGet(window.localStorage, AUTH_CONFIG.versionKey);
        if (savedVersion === AUTH_CONFIG.policyVersion) {
            return;
        }

        resetLockState();
        clearSession();
        safeStorageSet(window.localStorage, AUTH_CONFIG.versionKey, AUTH_CONFIG.policyVersion);
    }

    function hasValidSession() {
        const session = readJson(window.sessionStorage, AUTH_CONFIG.sessionKey);
        if (!session) {
            return false;
        }

        const expiresAt = Number(session.expiresAt || 0);
        if (expiresAt <= Date.now()) {
            clearSession();
            return false;
        }

        return true;
    }

    function setLockedUi() {
        document.body.classList.remove("is-unlocked", "is-security-tripped");
        document.body.classList.add("is-locked");
        gateLayer.hidden = false;
        gateLayer.removeAttribute("aria-hidden");
        workspace.hidden = true;
        workspace.inert = true;
        unlockPassword.value = "";
        unlockPassword.focus();
    }

    function setUnlockedUi() {
        document.body.classList.remove("is-locked", "is-security-tripped");
        document.body.classList.add("is-unlocked");
        gateLayer.hidden = true;
        gateLayer.setAttribute("aria-hidden", "true");
        workspace.hidden = false;
        workspace.inert = false;
        unlockPassword.value = "";
        setStatus("");
    }

    function relockWorkspace(message) {
        clearSession();
        trippedByDevtools = false;
        setStatus(message || "");
        setLockedUi();
    }

    function unlockWorkspace() {
        resetLockState();
        writeSession();
        setUnlockedUi();
    }

    function cleanUrlPassword() {
        try {
            const url = new URL(window.location.href);
            if (!url.searchParams.has("password")) {
                return;
            }

            url.searchParams.delete("password");
            const query = url.searchParams.toString();
            const next = url.pathname + (query ? "?" + query : "") + url.hash;
            window.history.replaceState(null, "", next);
        } catch {
            // ignore URL rewrite failures
        }
    }

    function elementAllowsInteraction(target) {
        return Boolean(target && target.closest("input, textarea, button"));
    }

    function blockContextActions(event) {
        event.preventDefault();
    }

    function blockSelection(event) {
        if (elementAllowsInteraction(event.target)) {
            return;
        }

        event.preventDefault();
    }

    function isBlockedShortcut(event) {
        const key = String(event.key || "").toLowerCase();
        const ctrlOrMeta = event.ctrlKey || event.metaKey;

        if (key === "f12") {
            return true;
        }

        if (ctrlOrMeta && event.shiftKey && ["i", "j", "c", "k"].includes(key)) {
            return true;
        }

        if (ctrlOrMeta && ["u", "s", "p"].includes(key)) {
            return true;
        }

        return false;
    }

    function lockOnInspection(message) {
        document.body.classList.add("is-security-tripped");
        relockWorkspace(message || DETECTION_MESSAGE);
    }

    function handleKeydown(event) {
        if (isBlockedShortcut(event)) {
            event.preventDefault();
            event.stopPropagation();
            lockOnInspection(DETECTION_MESSAGE);
        }
    }

    function blockClipboard(event) {
        if (elementAllowsInteraction(event.target)) {
            return;
        }

        event.preventDefault();
    }

    function isDockedDevtoolsOpen() {
        const widthGap = Math.abs(window.outerWidth - window.innerWidth);
        const heightGap = Math.abs(window.outerHeight - window.innerHeight);
        return widthGap > DEVTOOLS_THRESHOLD || heightGap > DEVTOOLS_THRESHOLD;
    }

    function runDebuggerProbe() {
        if (document.hidden) {
            return;
        }

        const startedAt = performance.now();
        debugger;
        const elapsed = performance.now() - startedAt;

        if (elapsed > DEBUGGER_THRESHOLD_MS) {
            trippedByDevtools = true;
        }
    }

    function securityHeartbeat() {
        if (isDockedDevtoolsOpen()) {
            trippedByDevtools = true;
        }

        runDebuggerProbe();

        if (trippedByDevtools) {
            lockOnInspection(DETECTION_MESSAGE);
        }
    }

    async function verifyPassword(password) {
        const derivedHex = await derivePasswordHex(password);
        return constantTimeEqual(derivedHex, AUTH_CONFIG.derivedHex);
    }

    async function attemptUnlock(rawPassword) {
        cleanUrlPassword();

        const password = String(rawPassword || "").trim();
        if (!password) {
            setStatus("密碼錯誤");
            unlockPassword.focus();
            return;
        }

        const cooldownRemainingMs = getCooldownRemainingMs();
        if (cooldownRemainingMs > 0) {
            setStatus("請稍後再試 " + formatDuration(cooldownRemainingMs));
            return;
        }

        unlockSubmit.disabled = true;

        try {
            const isValid = await verifyPassword(password);
            if (isValid) {
                unlockWorkspace();
                return;
            }

            const nextState = registerFailedAttempt();
            if (Number(nextState.cooldownUntil || 0) > Date.now()) {
                setStatus(
                    "請稍後再試 " +
                        formatDuration(Number(nextState.cooldownUntil || 0) - Date.now()),
                );
            } else {
                setStatus("密碼錯誤");
            }
        } catch {
            setStatus("驗證失敗");
        } finally {
            unlockSubmit.disabled = false;
            unlockPassword.select();
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        attemptUnlock(unlockPassword.value);
    }

    function handleLockClick() {
        relockWorkspace("");
    }

    function consumePasswordFromQuery() {
        try {
            const url = new URL(window.location.href);
            const password = url.searchParams.get("password");
            if (!password) {
                return;
            }

            unlockPassword.value = password;
            attemptUnlock(password);
        } catch {
            // ignore query failures
        }
    }

    function installDeterrents() {
        document.addEventListener("contextmenu", blockContextActions);
        document.addEventListener("auxclick", blockContextActions);
        document.addEventListener("dragstart", blockSelection);
        document.addEventListener("selectstart", blockSelection);
        document.addEventListener("copy", blockClipboard);
        document.addEventListener("cut", blockClipboard);
        document.addEventListener("keydown", handleKeydown, true);
        window.addEventListener("resize", securityHeartbeat);
        window.addEventListener("blur", function () {
            trippedByDevtools = false;
        });

        debuggerProbeId = window.setInterval(securityHeartbeat, DEBUGGER_PROBE_INTERVAL_MS);
    }

    function bootstrap() {
        resetLegacyStateIfNeeded();
        unlockForm.addEventListener("submit", handleSubmit);
        lockWorkspaceButton.addEventListener("click", handleLockClick);
        installDeterrents();

        if (hasValidSession()) {
            setUnlockedUi();
            return;
        }

        setLockedUi();
        consumePasswordFromQuery();
    }

    bootstrap();
})();
