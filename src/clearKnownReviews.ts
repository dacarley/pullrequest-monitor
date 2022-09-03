import { loadItems, deleteItems } from "$lib/storage";

const collectionName = "pullrequest-monitor";

export async function handler() {
    const items = await loadItems(collectionName);

    const idsToDelete = items
        .map(item => item.id)
        .filter(id => id.startsWith("reviewlist-"));

    if (idsToDelete.length) {
        await deleteItems(collectionName, idsToDelete);
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/html",
        },
        body: `
            <html>
                <body>
                    <h1>
                        The list of known reviews has been cleared!
                    </h1>

                    <h2>
                        You should receive an email momentarily that includes all currently available reviews.
                    </h2>
                </body>
            </html>
        `
    };
}
