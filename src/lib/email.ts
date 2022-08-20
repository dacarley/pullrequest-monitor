import { SESv2 } from "@aws-sdk/client-sesv2";
import type { Review } from "./types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const ses = new SESv2({});

export async function sendReviewsEmail(reviews: Review[]) {
    const reviewsHtml = reviews.map(review => {
        return [
            `<a href='https://reviewer.pullrequest.com/claim/${review.uuid}'><b>${review.title}</b></a>`,
            `${review.repository_name}`,
            `Opened <b>${dayjs(review.received_at).fromNow()}</b>`,
            getAdditionsAndDeletions(review),
            `Reviewed <b>${review.reviews_posted} ${review.reviews_posted ? "times" : "time"}</b>`,
            getSkills(review)
        ].map(str => `<div>${str}</div>`).join("\n");
    }).map(str => `<div style='margin-bottom: 20px;'>${str}</div>`).join("");

    await ses.sendEmail({
        FromEmailAddress: "dacarley@gmail.com",
        Destination: {
            ToAddresses: ["dacarley@gmail.com"]
        },
        Content: {
            Simple: {
                Body: {
                    Html: {
                        Data: `<html><body>${reviewsHtml}</body></html>`,
                    }
                },
                Subject: {
                    Data: "New PullRequest Reviews!",
                }
            }
        }
    });
}

function getSkills(review: Review) {
    const skills = [];

    for (const skill of review.skill_tags) {
        const matched = review.skill_matches.includes(skill);
        skills.push(matched ? `<b><span style='color: blue;'>${skill}</span></b>` : `<b><span style='color: #888;'>${skill}</span></b>`);
    }

    return skills.sort().reverse().join(" ");
}

function getAdditionsAndDeletions(review: Review) {
    let additions = 0;
    let deletions = 0;

    for (const change of review.changes) {
        additions += change.additions;
        deletions += change.deletions;
    }

    return `<b><span style='color: green;'>+${additions}</span> / <span style='color: red;'>-${deletions}</span></b>`;
}
