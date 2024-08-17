import { Construct } from "constructs";
import { Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import {
    Distribution,
    HttpVersion,
    PriceClass,
    SecurityPolicyProtocol,
    AllowedMethods,
    CachePolicy,
    CacheCookieBehavior,
    SSLMethod,
    LambdaEdgeEventType,
    CacheQueryStringBehavior,
    CacheHeaderBehavior,
    experimental,
    ViewerProtocolPolicy,
    CachedMethods,
    ResponseHeadersPolicy,
    OriginRequestPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
    Bucket,
    BlockPublicAccess,
    BucketEncryption,
    ObjectOwnership,
    BucketAccessControl,
    HttpMethods,
} from "aws-cdk-lib/aws-s3";

export interface ProtectedCDNProps {
    readonly tenant: string;
    readonly environment: string;
    readonly product: string;
    readonly jwt_issuer: string;
    readonly jwt_audience: string;
    readonly jwk_uri: string;
}

export class ProtectedCDN extends Construct {
    constructor(scope: Construct, id: string, props: ProtectedCDNProps) {
        super(scope, id);

        const contentBucket = new Bucket(this, "ContentBucket", {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            encryption: BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: RemovalPolicy.DESTROY,
            cors: [
                {
                    allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
                    allowedOrigins: ["*"],
                    allowedHeaders: ["authorization"],
                    exposedHeaders: ["Access-Control-Allow-Origin"],
                    maxAge: 3600,
                },
            ],
        });

        const loggingBucket = new Bucket(this, "LoggingBucket", {
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            encryption: BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: RemovalPolicy.DESTROY,
            objectOwnership: ObjectOwnership.OBJECT_WRITER,
            accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
            lifecycleRules: [
                {
                    id: "LogCleanup",
                    enabled: true,
                    expiration: Duration.days(180),
                },
            ],
        });

        const authorisor = new experimental.EdgeFunction(this, `Auth`, {
            runtime: Runtime.NODEJS_20_X,
            handler: `lambda.lambdaHandler`,
            code: Code.fromAsset("./resources/edge-authoriser", {
                bundling: {
                    image: Runtime.NODEJS_20_X.bundlingImage,
                    command: ["bash", "-c", ["make bundle-lambda"].join(" && ")],
                    environment: {
                        HOME: "/tmp",
                        // versioning for our monitoring
                        BRANCH: process.env.BRANCH ?? "",
                        COMMIT: process.env.COMMIT ?? "",
                        DATE: process.env.DATE ?? "",
                        // configutation for our authoriser
                        JWKS_URI: props.jwk_uri,
                        ISSUER: props.jwt_issuer,
                        AUDIENCE: props.jwt_audience,
                    },
                },
            }),
        });

        const staticAssetCachePolicy = new CachePolicy(this, "CachePolicy", {
            comment: "Static Asset Cache Policy",
            defaultTtl: Duration.hours(2),
            minTtl: Duration.minutes(1),
            maxTtl: Duration.days(1),
            cookieBehavior: CacheCookieBehavior.none(),
            queryStringBehavior: CacheQueryStringBehavior.none(),
            headerBehavior: CacheHeaderBehavior.none(),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
        });

        const cf = new Distribution(this, "Distribution", {
            defaultBehavior: {
                origin: new S3Origin(contentBucket),
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
                originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
                cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy: staticAssetCachePolicy,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                edgeLambdas: [
                    {
                        functionVersion: authorisor.currentVersion,
                        eventType: LambdaEdgeEventType.VIEWER_REQUEST,
                    },
                ],
            },
            enableIpv6: true,
            httpVersion: HttpVersion.HTTP2_AND_3,
            priceClass: PriceClass.PRICE_CLASS_100,
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            sslSupportMethod: SSLMethod.SNI,
            enableLogging: true,
            logBucket: loggingBucket,
            comment: `${props.tenant} ${props.environment} Protected CDN`,
            additionalBehaviors: {},
        });

        new CfnOutput(this, "CdnUrl", {
            value: cf.domainName,
            description: "CDN Url",
        });
    }
}
