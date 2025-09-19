// crawler.mjs
import { CheerioCrawler, log, LogLevel } from "crawlee";
import * as fs from "node:fs";

// Set log level
log.setLevel(LogLevel.DEBUG);

// The main aggregation object
const aggregateData = {};

const crawler = new CheerioCrawler({
    async requestHandler({ request, $, body }) {
        const title = $("title").text();
        const url = request.url;

       if ($(".template-skyscraper").length === 0) return;

        console.log({
            title,
            url,
            body: body.toString().slice(0, 500) + "...", // show first 200 chars
        });

        const city = $("h1 a:nth-child(5)").text().trim();
        const description = $("h2 + p").text().trim();
        const height = $(".skyscraper-info tr:nth-child(1) td").text().trim();
        const floor = $(".skyscraper-info tr:nth-child(2) td").text().trim();
        const year = $(".skyscraper-info tr:nth-child(3) td").text().trim();
        const architect = $(".skyscraper-info tr:nth-child(4) td").text().trim();
         // Find the anchor by its text
        const wikiLink = $("a")
            .filter((i, el) => $(el).text().trim() === "Read More at Wikipedia")
            .attr("href");

            // Select all <a> with the specific data-uk-lightbox attribute
        const anchors = $("a[data-uk-lightbox=\"{group:'photos'}\"]");

        const images = [];

        anchors.each((i, el) => {
            // Find <img> inside this <a>
            const img = $(el).find("img");
            if (img.length > 0) {
                const src = img.attr("src");
                const alt = img.attr("alt");
                if (src) images.push({ src, alt });
            }
        });

        console.log({ city, description, height, floor, year, architect, images, wikiLink });

        // Aggregate data
        aggregateData[url] = { title };
    },
    failedRequestHandler({ request }) {
        log.debug(`Request ${request.url} failed twice.`);
    },
});

// Start the crawl
await crawler.run(["https://demo.processwire.com/cities/amherst/coolidge-hall/", "https://demo.processwire.com/cities/atlanta/marriott-marquis/"]);

log.debug("Crawler finished.");

// At the end of the crawl, write aggregateData to disk
fs.writeFileSync("data.json", JSON.stringify(aggregateData, null, 2));
console.log("Data written to data.json");