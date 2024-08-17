import type { LambdaInterface } from "@aws-lambda-powertools/commons/types";
import { Context, CloudFrontRequestEvent, CloudFrontRequest } from "aws-lambda";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import cors from "./middy/corsmiddleware";
import { logger } from "./utils/observability";
import { config } from "./config";
import { router } from "./routes";

class Lambda implements LambdaInterface {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async handler(event: CloudFrontRequestEvent, context: Context) {
        const request: CloudFrontRequest = event.Records[0].cf.request;
        return router.handle(request);
    }
}

const handlerClass = new Lambda();

export const lambdaHandler = middy()
    .use(
        cors({
            disableBeforePreflightResponse: false,
            origin: "*",
            methods: "GET, HEAD",
            headers: "authorization",
            maxAge: 3600,
        }),
    )
    .use(injectLambdaContext(logger, { logEvent: config.DEBUG, clearState: true }))
    .handler(handlerClass.handler);
