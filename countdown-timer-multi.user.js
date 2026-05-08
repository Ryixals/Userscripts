// ==UserScript==
// @name         Countdown Timer Multi
// @namespace    http://tampermonkey.net/
// @version      7
// @description  Display multiple countdowns to a set date in the bottom right corner. Press Ctrl+. to toggle visibility.
// @author       Ryixals
// @match        *://*/*
// @icon         https://play-lh.googleusercontent.com/VIr_YSgkLv61_oRsgK9KDrukG4KcIQ9kpFE5KFz12Fl3wOgPanvVhqndF4KfZwFKKyKh
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let containerVisible = true;
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === '.') {
            e.preventDefault();
            containerVisible = !containerVisible;
            if (timerManager.container) {
                timerManager.container.style.display = containerVisible ? 'flex' : 'none';
            }
        }
    });

    if (window.__countdownTimerLoaded) return;
    window.__countdownTimerLoaded = true;

    const countdownFormat = "{name} in {days} days, {hours} hours, {minutes} minutes, {seconds} seconds";

    const STORAGE_KEY = "countdown_timers";

    const containerStyle = {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: "999999",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px"
    };

    const timerStyle = {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#ffffff",
        padding: "10px 15px",
        borderRadius: "8px",
        fontFamily: "monospace, 'Courier New', Courier",
        fontSize: "14px",
        fontWeight: "bold",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.2)",
        cursor: "auto",
        transition: "all 0.3s ease",
        userSelect: "none",
        textAlign: "center",
        minWidth: "320px"
    };

    const addButtonStyle = {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#4caf50",
        padding: "8px 12px",
        borderRadius: "8px",
        fontFamily: "monospace, 'Courier New', Courier",
        fontSize: "13px",
        border: "1px solid rgba(76, 175, 80, 0.5)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        textAlign: "center",
        minWidth: "200px",
        backdropFilter: "blur(4px)"
    };

    const removeButtonStyle = {
        position: "absolute",
        top: "-8px",
        right: "-8px",
        backgroundColor: "#ff4444",
        color: "white",
        borderRadius: "50%",
        width: "20px",
        height: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "1px solid white",
        zIndex: "10",
        transition: "all 0.2s ease"
    };

    function pad(num) {
        return num.toString().padStart(2, '0');
    }

    class TimerManager {
        constructor() {
            this.activeTimers = new Map();
            this.nextId = 1;
            this.container = null;
            this.init();
        }

        init() {
            this.container = document.createElement("div");
            Object.assign(this.container.style, containerStyle);
            document.body.appendChild(this.container);

            this.loadTimersFromStorage();

            this.addButton = document.createElement("div");
            Object.assign(this.addButton.style, addButtonStyle);
            this.addButton.innerHTML = "+ Add Timer";
            this.addButton.onmouseenter = (e) => {
                e.target.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
                e.target.style.transform = "scale(1.02)";
            };
            this.addButton.onmouseleave = (e) => {
                e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
                e.target.style.transform = "scale(1)";
            };
            this.addButton.onclick = () => this.showCustomTimerDialog();
            this.container.appendChild(this.addButton);
        }

        saveTimersToStorage() {
            const timersData = [];
            for (const [id, timerData] of this.activeTimers.entries()) {
                if (!timerData.targetDate) continue;
                timersData.push({
                    id: id,
                    name: timerData.name,
                    year: timerData.targetDate.getFullYear(),
                    month: timerData.targetDate.getMonth() + 1,
                    day: timerData.targetDate.getDate(),
                    hour: timerData.targetDate.getHours(),
                    minute: timerData.targetDate.getMinutes(),
                    second: timerData.targetDate.getSeconds(),
                    completionMessage: timerData.completionMessage
                });
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(timersData));
        }

        loadTimersFromStorage() {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            try {
                const timersData = JSON.parse(stored);
                for (const data of timersData) {
                    this.addTimer({
                        name: data.name,
                        year: data.year,
                        month: data.month,
                        day: data.day,
                        hour: data.hour,
                        minute: data.minute,
                        second: data.second,
                        completionMessage: data.completionMessage
                    }, data.id);
                }
                let maxId = 0;
                for (const id of this.activeTimers.keys()) {
                    if (id > maxId) maxId = id;
                }
                this.nextId = maxId + 1;
            } catch (e) {
                console.error("Failed to load timers from storage", e);
            }
        }

        showCustomTimerDialog() {
            const name = prompt("Enter timer name:", "My Event");
            if (!name) return;

            const year = parseInt(prompt("Enter year (e.g., 2025):", new Date().getFullYear() + 1));
            if (isNaN(year)) return;

            const month = parseInt(prompt("Enter month (1-12):", new Date().getMonth() + 1));
            if (isNaN(month) || month < 1 || month > 12) return;

            const day = parseInt(prompt("Enter day (1-31):", 1));
            if (isNaN(day) || day < 1 || day > 31) return;

            const hour = parseInt(prompt("Enter hour (0-23):", 0));
            if (isNaN(hour) || hour < 0 || hour > 23) return;

            const minute = parseInt(prompt("Enter minute (0-59):", 0));
            if (isNaN(minute) || minute < 0 || minute > 59) return;

            const second = parseInt(prompt("Enter second (0-59):", 0));
            if (isNaN(second) || second < 0 || second > 59) return;

            const completionMessage = prompt("Enter completion message:", `${name} has arrived! 🎉`);

            this.addTimer({
                name: name,
                year: year,
                month: month,
                day: day,
                hour: hour,
                minute: minute,
                second: second,
                completionMessage: completionMessage || `${name} has arrived! 🎉`
            });
        }

        addTimer(preset, reuseId = null) {
            const timerId = reuseId !== null ? reuseId : this.nextId++;
            if (reuseId === null && this.activeTimers.has(timerId)) {
                return;
            }

            const targetDate = new Date(
                preset.year,
                preset.month - 1,
                preset.day,
                preset.hour,
                preset.minute,
                preset.second
            );

            if (isNaN(targetDate.getTime())) {
                alert("Invalid date! Timer not added.");
                return;
            }

            const timerElement = document.createElement("div");
            timerElement.style.position = "relative";
            timerElement.style.display = "block";
            const contentDiv = document.createElement("div");
            Object.assign(contentDiv.style, timerStyle);
            timerElement.appendChild(contentDiv);

            const removeBtn = document.createElement("div");
            Object.assign(removeBtn.style, removeButtonStyle);
            removeBtn.innerHTML = "×";
            removeBtn.onmouseenter = (e) => {
                e.target.style.backgroundColor = "#cc0000";
                e.target.style.transform = "scale(1.1)";
            };
            removeBtn.onmouseleave = (e) => {
                e.target.style.backgroundColor = "#ff4444";
                e.target.style.transform = "scale(1)";
            };
            removeBtn.onclick = () => {
                this.removeTimer(timerId);
            };
            timerElement.appendChild(removeBtn);
            timerElement.contentDiv = contentDiv;

            this.container.insertBefore(timerElement, this.addButton);

            const timerData = {
                element: timerElement,
                contentDiv: contentDiv,
                interval: null,
                targetDate: targetDate,
                name: preset.name,
                completionMessage: preset.completionMessage
            };

            this.activeTimers.set(timerId, timerData);

            this.updateTimer(timerId);
            timerData.interval = setInterval(() => this.updateTimer(timerId), 1000);

            this.saveTimersToStorage();
        }

        updateTimer(timerId) {
            const timerData = this.activeTimers.get(timerId);
            if (!timerData) return;

            const now = new Date().getTime();
            const distance = timerData.targetDate.getTime() - now;

            if (distance < 0) {
                timerData.contentDiv.innerHTML = timerData.completionMessage;
                timerData.contentDiv.style.fontSize = "20px";
                timerData.contentDiv.style.color = "#4caf50";
                if (timerData.interval) {
                    clearInterval(timerData.interval);
                    timerData.interval = null;
                }

                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let display = countdownFormat
                .replace('{name}', timerData.name)
                .replace('{days}', days)
                .replace('{hours}', pad(hours))
                .replace('{minutes}', pad(minutes))
                .replace('{seconds}', pad(seconds));

            timerData.contentDiv.innerHTML = display;

            if (distance < 259200000) {
                timerData.contentDiv.style.color = "#ff0000";
                timerData.contentDiv.style.fontSize = "20px";
            } else if (distance < 604800000) {
                timerData.contentDiv.style.color = "#ff6666";
                timerData.contentDiv.style.fontSize = "19px";
            } else if (distance < 1209600000) {
                timerData.contentDiv.style.color = "#ffaa66";
                timerData.contentDiv.style.fontSize = "18px";
            } else if (distance < 1814400000) {
                timerData.contentDiv.style.color = "#ffbb66";
                timerData.contentDiv.style.fontSize = "17px";
            } else if (distance < 2419200000) {
                timerData.contentDiv.style.color = "#ffcc66";
                timerData.contentDiv.style.fontSize = "16px";
            } else if (distance < 3024000000) {
                timerData.contentDiv.style.color = "#ffdd66";
                timerData.contentDiv.style.fontSize = "15px";
            } else {
                timerData.contentDiv.style.color = "#ffffff";
                timerData.contentDiv.style.fontSize = "14px";
            }
        }

        removeTimer(timerId) {
            const timerData = this.activeTimers.get(timerId);
            if (timerData) {
                if (timerData.interval) {
                    clearInterval(timerData.interval);
                }
                if (timerData.element && timerData.element.parentNode) {
                    timerData.element.parentNode.removeChild(timerData.element);
                }
                this.activeTimers.delete(timerId);
                this.saveTimersToStorage();
            }
        }
    }

    const timerManager = new TimerManager();
})();