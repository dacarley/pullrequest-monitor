import { deleteItems, loadItems, saveItem, type Item } from "$lib/storage";
import * as pullrequestApi from "$lib/pullrequestApi";
import { mapToObject } from "$lib/utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { AvailableReviewsResult } from "$lib/types";
import { sendReviewsEmail } from "$lib/email";

dayjs.extend(utc);

const dateFormat = "YYYY-MM-DD";
const collectionName = "pullrequest-monitor";

export async function handler() {
    const items = await loadItems(collectionName);

    let token = items.find(item => item.id === "token")?.value;
    token = await pullrequestApi.init(token);
    await saveItem(collectionName, {
        id: "token",
        value: token
    });

    // Process the stored items
    const { reviewListIds, knownReviewDatesById } = parseItems(items);

    // Fetch the available reviews, and send an email about the new ones
    const result = await pullrequestApi.get<AvailableReviewsResult>("review_api/v1/reviews/available");
    const newReviews = result.data
        .map(review => ({...review, uuid: review.uuid.toLowerCase()}))
        .filter(review => !knownReviewDatesById[review.uuid]);
    if (newReviews.length) {
        await sendReviewsEmail(newReviews);
    }

    // Get rid of the old lists of reviews
    if (reviewListIds.length) {
        await deleteItems(collectionName, reviewListIds);
    }

    // Save new lists of reviews
    await saveKnownReviews({
        ...knownReviewDatesById,
        ...mapToObject(newReviews, review => {
            return [
                review.uuid,
                dayjs(review.created_at).utc().format(dateFormat)
            ];
        })
    });
}

function parseItems(items: Item[]) {
    const reviewListItems = items.filter(item => item.id.startsWith("reviewlist-"));
    const reviewIdsAndDates = reviewListItems.flatMap(item => item.value.split(","));
    const knownReviewDatesById = mapToObject(reviewIdsAndDates, str => str.split("."));

    return {
        reviewListIds: reviewListItems.map(item => item.id),
        knownReviewDatesById,
    };
}

async function saveKnownReviews(reviewDatesById: Record<string, string>) {
    const now = dayjs();

    const reviewIdsAndDates: string[] = [];
    for (const [id, date] of Object.entries(reviewDatesById)) {
        const diff = now.diff(dayjs(date, dateFormat), "days");
        if (diff < 14) {
            reviewIdsAndDates.push(`${id}.${date}`);
        }
    }

    // We're storing data in SSM Parameter Store, which limits values to 4000 characters.
    const matches = reviewIdsAndDates.join(",").matchAll(/(.{1,3900})(?:,|$)/g);
    let index = 0;
    for (const match of matches) {
        await saveItem(collectionName, {
            id: `reviewlist-${index}`,
            value: match[1]
        });

        ++index;
    }
}
