import { Router, RouterRequest, RouterResponse } from "./router";
import { config } from "./config";
import { authoriseRequest } from "./authoriser";

import versiondata from "./version.json";

export const router = new Router();

router.get("/version", async (req: RouterRequest, res: RouterResponse) => {
    res.status = 200;
    res.headers = {
        "content-type": [
            {
                key: "Content-Type",
                value: "application/json",
            },
        ],
    };
    res.body = versiondata;
});

router.any("/(.*)", async (req: RouterRequest, res: RouterResponse) => {
    // do we try to authorise the request?
    if (config.AUTH_ENABLED) {
        res.response = await authoriseRequest(req.request);
        return;
    }

    // pass the request through untouched
    res.response = req.request;
    return;
});
