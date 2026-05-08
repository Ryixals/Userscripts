// ==UserScript==
// @name         Countdown Timer
// @namespace    http://tampermonkey.net/
// @version      7
// @description  Display a countdown to a set date in the bottom right corner. Press CTRL+. to toggle visibility.
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
            if (timer) {
                timer.style.display = containerVisible ? 'flex' : 'none';
            }
        }
    });

    const targetYear = 2026;
    const targetMonth = 6;
    const targetDay = 3;
    const targetHour = 0;
    const targetMinute = 0;
    const targetSecond = 0;

    const targetDate = new Date(targetYear, targetMonth - 1, targetDay, targetHour, targetMinute, targetSecond);

    const style = {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#ffffff",
        padding: "10px 15px",
        borderRadius: "8px",
        fontFamily: "monospace, 'Courier New', Courier",
        fontSize: "14px",
        fontWeight: "bold",
        zIndex: "999999",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.2)",
        cursor: "auto",
        transition: "all 0.3s ease",
        userSelect: "none"
    };

    const countdownFormat = "Exams in {days} days, {hours} hours, {minutes} minutes, and {seconds} seconds";
    const completionFormat = "Good luck on your exams";

    const timer = document.createElement("div");
    Object.assign(timer.style, style);

    document.body.appendChild(timer);

    function pad(num) {
        return num.toString().padStart(2, '0');
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            timer.innerHTML = completionFormat;
            timer.style.fontSize = "18px";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        let display = countdownFormat
            .replace('{days}', days)
            .replace('{hours}', pad(hours))
            .replace('{minutes}', pad(minutes))
            .replace('{seconds}', pad(seconds));

        timer.innerHTML = display;

        if (distance < 259200000) {
            timer.style.color = "#ff0000";
            timer.style.fontSIze = "20px";
        } else if (distance < 604800000) {
            timer.style.color = "#ff6666";
            timer.style.fontSize = "19px";
        } else if (distance < 1209600000) {
            timer.style.color = "#ffaa66";
            timer.style.fontSize = "18px";
        } else if (distance < 1814400000) {
            timer.style.color = "#ffbb66";
            timer.style.fontSize = "17px";
        } else if (distance < 2419200000) {
            timer.style.color = "#ffcc66";
            timer.style.fontSize = "16px";
        } else if (distance < 3024000000) {
            timer.style.color = "#ffdd66";
            timer.style.fontSize = "15px";
        } else {
            timer.style.color = "#ffffff";
            timer.style.fontSize = "14px";
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
})();