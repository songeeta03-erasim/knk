let allChannels = [];
let filteredChannels = [];
let currentCategory = "All Channels";
let activeChannelUrl = null;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let showOnlyFavorites = false;
let currentChannelIndex = 0;


document
.getElementById("searchInput")
.addEventListener("input",()=>{

    applyFilters();

});

document
.getElementById("playlistFile")
.addEventListener("change", function(e){

    const file = e.target.files[0];

    const reader = new FileReader();

    reader.onload = function(){

        allChannels = parseM3U(reader.result);

        filteredChannels = allChannels;

        buildCategories();
        applyFilters();
        if (allChannels.length > 0) {
    playChannel(allChannels[0].url);
}

    };

    reader.readAsText(file);
});

function renderChannels() {
//to show channel number 
    const totalChannels = allChannels.length; // original full list
const shownChannels = filteredChannels.length;

document.getElementById("channelCount").innerText =
    `Showing ${shownChannels} of ${totalChannels} channels`;
    // previous one
    const grid = document.getElementById("channelGrid");

    // 1️⃣ SHOW SHIMMER FIRST
    grid.innerHTML = "";

    for (let i = 0; i < 12; i++) {
        const placeholder = document.createElement("div");
        placeholder.className = "channel-item shimmer";

        placeholder.innerHTML = `
            <div style="width:80px;height:80px;"></div>
            <div style="width:60px;height:10px;background:#333;margin-top:10px;border-radius:5px;"></div>
            <div style="width:40px;height:8px;background:#2a2a2a;margin-top:5px;border-radius:5px;"></div>
        `;

        grid.appendChild(placeholder);
    }

    // 2️⃣ LOAD REAL CHANNELS AFTER SHORT DELAY
    setTimeout(() => {
        grid.innerHTML = "";

        filteredChannels.forEach((channel) => {
            const div = document.createElement("div");
            div.className = "channel-item" +
                (activeChannelUrl === channel.url ? " active" : "");

            div.innerHTML = `
${channel.logo && channel.logo.trim() ? `
                                        <img 
                                            src="${channel.logo && channel.logo.trim() 
                                                ? channel.logo 
                                                : 'assets/default-channel.avif'}"
                                            class="channel-logo"
                                            loading="lazy"
                                            decoding="async"
                                            onerror="this.src='assets/default-channel.avif'"
                                        >
                                        ` : `
                                            <div class="channel-logo-fallback">
                                                ${getInitials(channel.name)}
                                            </div>
                                        `}

                            <div class="channel-name">${channel.name || 'Unknown Channel'}</div>
                            <div class="channel-category">${channel.category || ''}</div>

                            <button class="fav-btn" onclick="toggleFavorite(event, ${JSON.stringify(channel.name)})">
<button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${channel.name}')">
    <i class="${favorites.includes(channel.name) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
</button>

                        `;

            div.onclick = () => playChannel(channel.url);
            grid.appendChild(div);
        });

    }, 300);
}


function getInitials(name) {
    if (!name) return "TV";

    return name
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}


document.getElementById("nextChannelBtn").addEventListener("click", () => {
    let nextIndex = currentChannelIndex + 1;
    if (nextIndex >= filteredChannels.length) nextIndex = 0; // loop back
    currentChannelIndex = nextIndex;
    playChannel(filteredChannels[currentChannelIndex].url);
});

document.getElementById("prevChannelBtn").addEventListener("click", () => {
    let prevIndex = currentChannelIndex - 1;
    if (prevIndex < 0) prevIndex = filteredChannels.length - 1; // loop to last
    currentChannelIndex = prevIndex;
    playChannel(filteredChannels[currentChannelIndex].url);
});




document
.getElementById("loadUrlBtn")
.addEventListener("click", async ()=>{

    const url =
        document.getElementById("playlistUrl").value;

    if(!url) return;

    try{

        const response = await fetch(
            "http://localhost:3000/playlist?url=" +
            encodeURIComponent(url)
        );

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const text = await response.text();

        console.log("RAW:", text);

        if (!text.includes("#EXTINF")) {
            throw new Error("Invalid M3U playlist");
        }

        allChannels = parseM3U(text);

        filteredChannels = allChannels;

        buildCategories();
        applyFilters();
        if (allChannels.length > 0) {
    playChannel(allChannels[0].url);
}

        localStorage.setItem("playlistUrl", url);

    }
    catch(error){

        console.log(error);
        alert("Failed to load playlist: " + error.message);

    }

});


window.onload = async ()=>{

    const saved =
    localStorage.getItem(
        "playlistUrl"
    );

    if(saved){

        document
        .getElementById("playlistUrl")
        .value = saved;

    }

};


document
.getElementById("resetBtn")
.addEventListener("click",()=>{

    localStorage.removeItem(
        "playlistUrl"
    );

    allChannels = [];

    renderChannels();

    location.reload();

});


document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const drawer = document.getElementById("drawer");
    const overlay = document.getElementById("overlay");

    menuBtn.addEventListener("click", () => {
        drawer.classList.toggle("open");   // toggle on/off
        overlay.classList.toggle("show");  // toggle on/off
    });

    overlay.addEventListener("click", () => {
        drawer.classList.remove("open");
        overlay.classList.remove("show");
    });
});


window.addEventListener("DOMContentLoaded", () => {

    const last = localStorage.getItem("lastChannel");

    if(last){

        setTimeout(() => {
            playChannel(last);
        }, 500);

    }

});

window.addEventListener("DOMContentLoaded", async () => {

    try {

        const response =
            await fetch("playlists/channels.m3u");

        const text =
            await response.text();

        allChannels = parseM3U(text);

        filteredChannels = allChannels;

        buildCategories();
        applyFilters();
        if (allChannels.length > 0) {
    playChannel(allChannels[0].url);
}

    } catch (err) {

        console.error(err);

    }

});

const defaultPlaylists = {
    "Bangla": "playlists/List1.m3u",
    "Hindi": "playlists/List2.m3u",
    "Sports": "playlists/List3.m3u",
};
function loadDefaultPlaylist(name) {
    const url = defaultPlaylists[name];
    if (!url) return;

    fetch(url)
        .then(res => res.text())
        .then(text => {
            allChannels = parseM3U(text);
            filteredChannels = allChannels;
            buildCategories();
            applyFilters();
            if (allChannels.length > 0) {
                playChannel(allChannels[0].url);
            }
            localStorage.setItem("playlistUrl", url);
        })
        .catch(err => console.error("Failed to load default playlist:", err));
}

window.addEventListener("DOMContentLoaded", async () => {

    try {

        const response =
            await fetch("playlists/channels.m3u");

        const text =
            await response.text();

        allChannels = parseM3U(text);

        filteredChannels = allChannels;

        buildCategories();
        applyFilters();
        if (allChannels.length > 0) {
    playChannel(allChannels[0].url);
}

    } catch (err) {

        console.error(err);

    }

});



function buildCategories() {
    const bar = document.getElementById("categoryBar");
    bar.innerHTML = "";

    const baseCategories = ["All Channels", "Favorites"];
    let categories = [...new Set(allChannels.map(c => c.category).filter(Boolean))];
    categories = baseCategories.concat(categories);

    categories.forEach(category => {
        const btn = document.createElement("button");
        btn.innerText = category;

        // Apply active class correctly
        if (category === currentCategory) {
            btn.classList.add("active");
        }

        btn.onclick = () => {
            currentCategory = category;
            applyFilters();
            buildCategories(); // rebuild bar so active state updates
        };

        bar.appendChild(btn);
    });

    bar.style.display = "flex";
    bar.style.flexWrap = "wrap";
    bar.style.justifyContent = "center";
    bar.style.gap = "10px";
}




function applyFilters() {
    const search = document.getElementById("searchInput").value.toLowerCase();

    filteredChannels = allChannels.filter(channel => {
        const name = (channel.name || "").toLowerCase();

        const categoryMatch =
            currentCategory === "All Channels" ||
            channel.category === currentCategory;

        const searchMatch = name.includes(search);

        // If Favorites is selected, only show channels in favorites list
        if (currentCategory === "Favorites") {
            return favorites.includes(channel.name) && searchMatch;
        }

        return categoryMatch && searchMatch;
    });

    renderChannels();
}



function toggleFavorite(name) {
    if (favorites.includes(name)) {
        favorites = favorites.filter(f => f !== name);
    } else {
        favorites.push(name);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderChannels(); // refresh UI
}




function showFavorites(){

    showOnlyFavorites = !showOnlyFavorites;

    applyFilters();
}


function setActivePlaylist(button, name) {
  // remove active class from all buttons
  document.querySelectorAll('.playlist-btn').forEach(btn => btn.classList.remove('active'));

  // add active class to the clicked one
  button.classList.add('active');

  // load the playlist
  loadDefaultPlaylist(name);
}

/* ==========================
STARTUP SCREEN
========================== */

window.addEventListener(
"load",
()=>{
setTimeout(
()=>{
document
.getElementById(
"startupLoader"
)
?.remove();
},
2000
);
});
