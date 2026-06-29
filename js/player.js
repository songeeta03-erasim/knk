let currentHls = null;
let streamTimeout = null;
letfailedChannels = new Set();
let currentUrl = null;

let hasPlayed = false;
let reconnecting = false;

function playChannel(url) {

    const video = document.getElementById("videoPlayer");
    const loader = document.getElementById("loader");

    currentUrl = url;
    hasPlayed = false;
    reconnecting = false;

    activeChannelUrl = url;
    localStorage.setItem("lastChannel", url);

    loader.style.display = "block";
    renderChannels();

    clearTimeout(streamTimeout);

    video.pause();
    video.removeAttribute("src");
    video.load();

    if (currentHls) {
        currentHls.destroy();
        currentHls = null;
    }

    startPlayer(url);

    video.onwaiting = () => {
        loader.style.display = "block";
    };

    video.onplaying = () => {
        loader.style.display = "none";
        hasPlayed = true;
    };
}

function startPlayer(url){

    const video = document.getElementById("videoPlayer");

    clearTimeout(streamTimeout);

    // Give stream 15 sec to start/reconnect
    streamTimeout = setTimeout(() => {

        if(hasPlayed){

            reconnectCurrentChannel();

        }else{

            console.log("Channel dead.");

            failedChannels.add(url);

            playNextChannel();

        }

    },15000);

    if(Hls.isSupported()){

        currentHls = new Hls({
            enableWorker:true,
            maxBufferLength:60,
            maxMaxBufferLength:120,
            backBufferLength:30,
            lowLatencyMode:false
        });

        currentHls.loadSource(url);
        currentHls.attachMedia(video);

        currentHls.on(Hls.Events.MANIFEST_PARSED,()=>{

            clearTimeout(streamTimeout);

            hasPlayed = true;

            video.play().catch(()=>{});

        });

currentHls.on(Hls.Events.ERROR, (event, data) => {

    if (!data.fatal) return;

    console.log("HLS Error:", data.type);

    switch (data.type) {

        case Hls.ErrorTypes.NETWORK_ERROR:

            console.log("Network error → Trying startLoad()");

            currentHls.startLoad();

            // Wait 15 seconds to see if it recovers
            setTimeout(() => {
                if (!hasPlayed) {
                    reconnectCurrentChannel();
                }
            }, 15000);

            break;

        case Hls.ErrorTypes.MEDIA_ERROR:

            console.log("Media error → Trying recoverMediaError()");

            currentHls.recoverMediaError();

            break;

        default:

            console.log("Unrecoverable error");

            reconnectCurrentChannel();

            break;
    }

});

    }else{

        video.src = url;

        video.onloadedmetadata = ()=>{

            clearTimeout(streamTimeout);

            hasPlayed = true;

            video.play().catch(()=>{});

        };

        video.onerror = ()=>{

            if(hasPlayed){

                reconnectCurrentChannel();

            }else{

                failedChannels.add(url);

                playNextChannel();

            }

        };

    }

}

function reconnectCurrentChannel(){

    if(reconnecting) return;

    reconnecting = true;

    console.log("Trying reconnect...");

    if(currentHls){

        currentHls.destroy();
        currentHls = null;

    }

    startPlayer(currentUrl);

    setTimeout(()=>{

        if(!hasPlayed){

            console.log("Reconnect failed");

            failedChannels.add(currentUrl);

            reconnecting = false;

            playNextChannel();

        }else{

            reconnecting = false;

            console.log("Reconnect success");

        }

    },15000);

}

function playNextChannel(){

    if(!filteredChannels || filteredChannels.length===0) return;

    let currentIndex = filteredChannels.findIndex(c=>c.url===currentUrl);

    if(currentIndex===-1) currentIndex=0;

    const total = filteredChannels.length;

    for(let i=1;i<=total;i++){

        const idx = (currentIndex+i)%total;

        const channel = filteredChannels[idx];

        if(failedChannels.has(channel.url)) continue;

        console.log("Next:",channel.name);

        playChannel(channel.url);

        return;

    }

    console.log("All failed. Reset list.");

    failedChannels.clear();

    playChannel(filteredChannels[0].url);

}
