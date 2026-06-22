let currentHls = null;
let streamTimeout = null;
let failedChannels = new Set();
let currentUrl = null;

function playChannel(url) {
    const video = document.getElementById("videoPlayer");
    const loader = document.getElementById("loader");

    currentUrl = url;

    activeChannelUrl = url;
    localStorage.setItem("lastChannel", url);

    loader.style.display = "block";
    renderChannels();

    video.pause();
    video.removeAttribute("src");
    video.load();

    clearTimeout(streamTimeout);

    if (currentHls) {
        currentHls.destroy();
        currentHls = null;
    }

    // ⏱ dead stream detection
    streamTimeout = setTimeout(() => {
        console.log("Timeout → next channel");
        playNextChannel();
    }, 8000);

    if (Hls.isSupported()) {

        currentHls = new Hls({
            enableWorker: true,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            backBufferLength: 30,
            lowLatencyMode: false
        });

        currentHls.loadSource(url);
        currentHls.attachMedia(video);

        currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
            clearTimeout(streamTimeout);
            video.play().catch(() => {});
        });

        currentHls.on(Hls.Events.ERROR, (event, data) => {

            if (!data.fatal) return;

            console.log("Fatal error:", data);

            failedChannels.add(currentUrl);

            currentHls.destroy();
            currentHls = null;

            playNextChannel();
        });

    } else {
        video.src = url;

        video.onloadedmetadata = () => {
            clearTimeout(streamTimeout);
            video.play().catch(() => {});
        };

        video.onerror = () => {
            failedChannels.add(currentUrl);
            playNextChannel();
        };
    }

    video.onwaiting = () => loader.style.display = "block";
    video.onplaying = () => loader.style.display = "none";
}

function playNextChannel() {
    if (!filteredChannels || filteredChannels.length === 0) return;

    // 🔥 ALWAYS find current index fresh (VERY IMPORTANT FIX)
    let currentIndex = filteredChannels.findIndex(c => c.url === currentUrl);

    if (currentIndex === -1) currentIndex = 0;

    const total = filteredChannels.length;

    // forward search only
    for (let i = 1; i <= total; i++) {

        const idx = (currentIndex + i) % total;
        const channel = filteredChannels[idx];

        if (failedChannels.has(channel.url)) continue;

        console.log("Next working channel:", channel.name);

        playChannel(channel.url);
        return;
    }

    console.log("Resetting failed list (all channels failed)");

    failedChannels.clear();
    playChannel(filteredChannels[0].url);
}
