import { image_search } from 'duckduckgo-images-api';

(async () => {
    try {
        const results = await image_search({ query: "Dell R760XS Server HD", moderate: true });
        console.log(results.slice(0, 3));
    } catch (e) {
        console.error(e);
    }
})();
