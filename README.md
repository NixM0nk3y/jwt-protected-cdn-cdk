# Welcome to protected-cdn

Test Bed Project to demonstrate a CDN protected by Oauth JWT Tokens


## Architecture

The CDK stands up a sample Cloudfront CDN with a backing S3 bucket. The CDN is protected by a typescript [lambda@edge](https://aws.amazon.com/lambda/edge/).

![diagram](_media/ProtectedCDN.png ":size=25%")

## Configuration

Setting the following environment variable prior to deploying the stack will configure the lambda with the appropriate JWT validation settings.

* `JWKS_URI`
* `ISSUER`
* `AUDIENCE`

## Operation

Ensure a JWT is passed into the CDN using a `Authorisation: Bearer $token` header e.g.

```curl -v -H "Authorization: Bearer foo.bar.wibble" https://dimbkitty5.cloudfront.net/```

Generating the bearer token can be done via any oauth2 flow using a helper for example:

* [oauth2c](https://github.com/cloudentity/oauth2c)


A unauthenticated version is available at `/version` for lambda validation:

```
$curl https://dimbkitty5.cloudfront.net/version
{"gitHash":"163bad7","buildBranch":"main","buildNumber":"1.0.0","buildDate":"2024-08-11T17:50"}
```


## Useful commands

-   `make clean` remove any intermediate state
-   `make diff` compare deployed stack with current state
-   `make deploy ` deploy this stack to your default AWS account/region
