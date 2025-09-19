import { CheerioCrawler, log, LogLevel } from "crawlee";
import * as fs from "node:fs";

// The main aggregation object
const aggregateData = {};

const crawler = new CheerioCrawler({
    async requestHandler({pushData, request, $}) {
        const title = $('title').text();
        const url = request.url;
        if (!url.includes('/cities')) return;

        console.log({ title, url });

        // Aggregate data
        // aggregateData[url] = { title };
    },
    failedRequestHandler({request}) {
        log.debug(`Request ${request.url} failed twice.`);
    },
});

// Start the crawl as before
await crawler.run(['https://crawlee.dev']);

log.debug('Crawler finished.');


// At the end of the crawl, write aggregateData to disk
fs.writeFileSync('data.json', JSON.stringify(aggregateData, null, 2));
console.log('Data written to data.json');