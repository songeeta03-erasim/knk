function playChannel(url) {
    const video = document.getElementById("videoPlayer");

    activeChannelUrl = url;
    localStorage.setItem("lastChannel", url);
    document.getElementById("loader").style.display = "block";
    renderChannels();

    // Reset previous stream
    video.pause();
    video.removeAttribute("src");
    video.load();

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play();
        });

        hls.on(Hls.Events.ERROR, function () {
            document.getElementById("loader").style.display = "none";
        });
    } else {
        video.src = url;
        video.oncanplay = () => {
            document.getElementById("loader").style.display = "none";
            video.play();
        };
    }

video.onplaying = () => {
    document.getElementById("loader").style.display = "none";

    // ✅ Fullscreen
    if (video.requestFullscreen) {
        video.requestFullscreen().catch(err => {
            console.log("Fullscreen failed:", err);
        });
    } else if (video.webkitEnterFullscreen) {
        // iOS Safari/Chrome fallback
        video.webkitEnterFullscreen();
    }

    // ✅ Orientation lock (only works on Android Chrome/Firefox)
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(err => {
            console.log("Orientation lock failed:", err);
        });
    } else {
        // iOS fallback: show a hint
        console.log("Orientation lock not supported on iOS.");
        // Optional: alert("Please rotate your device for fullscreen landscape view.");
    }
};

}
