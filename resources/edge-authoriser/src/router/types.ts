export type RouterHandler = (req: RouterRequest, res: RouterResponse, next: RouterNext) => any;
import { CloudFrontRequest, CloudFrontHeaders, CloudFrontResultResponse } from "aws-lambda";

export type RouterRequest<E = any> = {
    request: CloudFrontRequest;
    method: string;
    params: Record<string, string>;
    query: Record<string, string>;
    headers: CloudFrontHeaders;
    body: any;
};

export type RouterResponse = {
    headers: CloudFrontHeaders;
    status?: number;
    response?: CloudFrontResultResponse | CloudFrontRequest;
    body?: any;
};

export type RouterNext = () => Promise<void>;
