# Welcome to protected-cdn

Test Bed Project to demonstrate a CDN protected by Oauth JWT Tokens

## Configuration

Setting the following environment variable prior to deploying the stack will configure the lambda with the appropriate JWT validation

* `JWKS_URI`
* `ISSUER`
* `AUDIENCE`

## Operation

Ensure a JWT is passed into the CDN using a `Authorisation: Bearer $token` header

## Useful commands

-   `make clean` remove any intermediate state
-   `make diff` compare deployed stack with current state
-   `make deploy ` deploy this stack to your default AWS account/region
