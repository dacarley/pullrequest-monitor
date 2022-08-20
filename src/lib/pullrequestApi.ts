import fetch from "node-fetch";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";

type DecodedToken = {
    iss: string;
    iat: number;
    exp: number;
    nbf: number;
    jti: string;
    sub: string;
    prv: string;
}

let token: string;

export async function init(_token: string) {
    token = _token;

    if (shouldRefreshToken(token)) {
        const result = await get("jwt/refresh");
        token = result.token;
    }

    return token;
}

export async function get<T = Record<string, any>>(path) {
    const result = await fetch(`https://app.pullrequest.com/${path}`, {
        "method": "GET",
        "headers": {
            "authorization": `Bearer ${token}`,
            "content-type": "application/json",
        },
    });

    return result.json() as Promise<T>;
}

function shouldRefreshToken(token: string) {
    const decodedToken = jwt_decode<DecodedToken>(token);
    const minutesRemaining = dayjs.unix(decodedToken.exp).diff(dayjs(), "minutes");

    return minutesRemaining < 1;
}
