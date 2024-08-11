#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ProtectedCdnStack } from "../lib/protected-cdn-stack";

function capitalise(s: string): string {
    return s[0].toUpperCase() + s.substr(1).toLowerCase();
}

const app = new cdk.App();

// infra namespacing
const tenant = process.env.TENANT ?? "Abc";
const product = process.env.PRODUCT ?? "ProtectedCdn";
const environment = process.env.ENVIRONMENT ?? "Dev";

// configuration for our authorisor
const jwk_uri = process.env.JWKS_URI ?? "https://example1.com/path/to/jwks.json";
const jwt_audience = process.env.AUDIENCE ?? "https://example1.com";
const jwt_issuer = process.env.ISSUER ?? "6789,3456";

new ProtectedCdnStack(app, capitalise(tenant) + capitalise(product) + capitalise(environment), {
    tenant: tenant,
    environment: environment,
    product: product,
    jwk_uri: jwk_uri,
    jwt_audience: jwt_audience,
    jwt_issuer: jwt_issuer,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION ?? "eu-west-1" },
});
