import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ProtectedCDN } from "./constructs/protected-cdn";

export interface ProtectedCdnStackProps extends cdk.StackProps {
    readonly tenant: string;
    readonly environment: string;
    readonly product: string;
    readonly jwt_issuer: string;
    readonly jwt_audience: string;
    readonly jwk_uri: string;
}

export class ProtectedCdnStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ProtectedCdnStackProps) {
        super(scope, id, props);

        new ProtectedCDN(this, "ProtectedCDN", {
            tenant: props.tenant,
            environment: props.environment,
            product: props.product,
            jwk_uri: props.jwk_uri,
            jwt_audience: props.jwt_audience,
            jwt_issuer: props.jwt_issuer,
        });
    }
}
