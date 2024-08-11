import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { Tracer } from "@aws-lambda-powertools/tracer";

import versiondata from "../version.json";

const config = { namespace: "abc", serviceName: "cdnAuthoriser" };

const logger = new Logger({
    ...config,
    persistentLogAttributes: {
        aws_account_id: process.env.AWS_ACCOUNT_ID || "N/A",
        aws_region: process.env.AWS_REGION || "N/A",
        app_version: versiondata.buildDate,
        app_buildhash: versiondata.gitHash,
        app_buildbranch: versiondata.buildBranch,
    },
});

const metrics = new Metrics({
    ...config,
    defaultDimensions: {
        aws_account_id: process.env.AWS_ACCOUNT_ID || "N/A",
        aws_region: process.env.AWS_REGION || "N/A",
    },
});

const tracer = new Tracer({
    ...config,
});

export { logger, metrics, tracer };
