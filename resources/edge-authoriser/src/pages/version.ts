import { CloudFrontResultResponse } from "aws-lambda";

export interface Version {
    gitHash: string;
    buildBranch: string;
    buildNumber: string;
    buildDate: string;
}

import versiondata from "../version.json";

export function versionResponse(): CloudFrontResultResponse {
    const version: Version = versiondata;

    const response: CloudFrontResultResponse = {
        status: "200",
        statusDescription: "OK",
        headers: {
            "Content-Type": [
                {
                    key: "Content-Type",
                    value: "application/json",
                },
            ],
        },
        body: JSON.stringify(version),
    };
    return response;
}
