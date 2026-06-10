function parseM3U(content) {
    const lines = content.split('\n');
    const channels = [];
    let current = null;

    lines.forEach(line => {
        line = line.trim();

        if (line.startsWith("#EXTINF")) {
            const name = line.split(",").pop()?.trim() || "Unknown Channel";

            const logoMatch = line.match(/tvg-logo="(.*?)"/);
            const logo = logoMatch ? logoMatch[1] : "";

            const groupMatch = line.match(/group-title="(.*?)"/);
            let category = groupMatch ? groupMatch[1].trim() : "";

            current = {
                name,
                url: "",
                category, // leave empty if not provided
                logo
            };
        }
        else if (line.startsWith("http")) {
            if (current) {
                current.url = line;
                channels.push(current);
                current = null;
            }
        }
    });

    return channels.filter(c => c.name && c.url);
}
