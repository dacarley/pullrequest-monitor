export type Review = {
    uuid: string;
    number: number;
    received_at: string;
    created_at: string;
    updated_at: string;
    user_name: string;
    repository_name: string;
    title: string;
    body: string;
    changes: {
        extension: string;
        total_lines: number;
        additions: number;
        deletions: number;
    }[];
    skill_tags: string[];
    skill_matches: string[];
    type: string;
    priority_tags: string[];
    reviews_posted: number;
};

export type AvailableReviewsResult = {
    data: Review[];
};
