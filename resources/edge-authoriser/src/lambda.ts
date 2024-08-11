import { versionResponse } from "./pages";
import type { LambdaInterface } from "@aws-lambda-powertools/commons/types";
import { Context, CloudFrontRequestEvent, CloudFrontRequest } from "aws-lambda";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { logger } from "./utils/observability";
import { authoriseRequest } from "./authoriser";
import config from "./config";

class Lambda implements LambdaInterface {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async handler(event: CloudFrontRequestEvent, context: Context) {
        const request: CloudFrontRequest = event.Records[0].cf.request;

        // override the version route
        if (request.uri == "/version") {
            logger.info("returning version response");
            return versionResponse();
        }

        // bypass auth for OPTIONS / cors request and rely on origin controls
        if (config().ENABLE_CORS_PASSTHROUGH && request.method == "OPTIONS") {
            return request;
        }

        // do we try to authorise the request?
        if (config().AUTH_ENABLED) {
            return authoriseRequest(request);
        }

        // pass the request through untouched
        return request;
    }
}

const handlerClass = new Lambda();

export const lambdaHandler = middy(handlerClass.handler).use(
    injectLambdaContext(logger, { logEvent: config().DEBUG, clearState: true }),
);
