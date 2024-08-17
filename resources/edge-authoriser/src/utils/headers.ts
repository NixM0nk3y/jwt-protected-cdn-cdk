import { CloudFrontHeaders } from "aws-lambda";

export const retrieveHeaderValue = (headers: CloudFrontHeaders, key: string): string | undefined => {
    if (key.toLowerCase() in headers) {
        return headers[key.toLowerCase()].pop()?.value;
    }
    return;
};

export const appendHeader = (headers: CloudFrontHeaders, key: string, value: string): CloudFrontHeaders => {
    if (key.toLowerCase() in headers) {
        headers[key.toLowerCase()].push({
            key: key,
            value: value,
        });
    } else {
        headers[key.toLowerCase()] = [
            {
                key: key,
                value: value,
            },
        ];
    }
    return headers;
};
