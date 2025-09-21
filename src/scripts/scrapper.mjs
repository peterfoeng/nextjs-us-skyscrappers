// crawler.mjs
import { CheerioCrawler, log, LogLevel } from "crawlee";
import * as fs from "node:fs";

// Set log level
log.setLevel(LogLevel.DEBUG);

const aggregateData = [];

const crawler = new CheerioCrawler({
    async requestHandler({ request, $, body, enqueueLinks }) {
        const title = $("title").text();
        const url = request.url;

        // ✅ enqueue more city links
        await enqueueLinks({
            selector: 'a[href*="/cities/"]',
        });

        if ($(".template-skyscraper").length === 0) return;

        const skyscraper = $(".skyscraper-info + h2").text().trim().replace("About ", "");
        const city = $("h1 a:nth-child(5)").text().trim();
        const description = $("h2 + p").text().trim();

        const scriptContent = $("script")
            .toArray()
            .map((el) => $(el).html())
            .join("\n");

        const match = scriptContent.match(/mgmap1\.init\('mgmap1',([\d.-]+),([\d.-]+)\)/);
        const latlng = { lat: null, lng: null };
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            latlng.lat = lat;
            latlng.lng = lng;
            console.log(`${request.url} → lat: ${lat}, lng: ${lng}`);
        }
        // const height = $(".skyscraper-info tr:nth-child(1) td").text().trim();
        // const floor = $(".skyscraper-info tr:nth-child(2) td").text().trim();
        // const year = $(".skyscraper-info tr:nth-child(3) td").text().trim();
        // const architect = $(".skyscraper-info tr:nth-child(4) td").text().trim();

        const info = {};

        $(".uk-table.skyscraper-info tr").each((i, el) => {
            const label = $(el).find("th").text().trim();
            if (!label) return;

            if (label.toLowerCase() === "architects" || label.toLowerCase() === "architect") {
                // Extract all architect names into an array
                const architects = $(el)
                    .find("td ul.uk-list li a")
                    .map((_, a) => $(a).text().trim())
                    .get();

                info[label.toLowerCase()] = architects;
            } else {
                const value = $(el).find("td").text().trim();
                if (value) {
                    info[label.toLowerCase()] = value;
                }
            }
        });

        const wikiLink = $("a")
            .filter((i, el) => $(el).text().trim() === "Read More at Wikipedia")
            .attr("href");

        const images = [];
        $("a[data-uk-lightbox=\"{group:'photos'}\"]").each((i, el) => {
            const img = $(el).find("img");
            if (img.length > 0) {
                const src = img.attr("src");
                const alt = img.attr("alt");
                if (src) images.push({ src, alt });
            }
        });

        console.log(`Extracted data for ${city} - ${title}`);

        aggregateData.push({ skyscraper, city, description, ...info, lat: latlng.lat, lng: latlng.lng, images, wikiLink });
    },
    failedRequestHandler({ request }) {
        log.debug(`Request ${request.url} failed twice.`);
    },
});

await crawler.run([
    "https://demo.processwire.com/cities/",
    // "https://demo.processwire.com/cities/ann-arbor/ashley-terrace/",
]);

log.debug("Crawler finished.");

fs.writeFileSync("data.json", JSON.stringify(aggregateData, null, 2));
console.log("Data written to data.json");