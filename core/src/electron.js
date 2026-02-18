document.getElementById("minimizeWindow").addEventListener("click", () => {
    electron.minimize();
})
document.getElementById("fullscreenWindow").addEventListener("click", () => {
    electron.fullscreen();
})
document.getElementById("closeWindow").addEventListener("click", () => {
    electron.close();
})