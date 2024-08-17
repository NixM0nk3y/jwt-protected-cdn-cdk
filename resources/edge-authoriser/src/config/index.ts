import { envSchema } from "env-schema";
import { Static, Type } from "@sinclair/typebox";

const schema = Type.Object({
    AUTH_ENABLED: Type.Boolean({ default: true }),
    AUTH_GRACE: Type.Number({ default: 10 }),
    DEBUG: Type.Boolean({ default: true }),
    ENABLE_CORS_PASSTHROUGH: Type.Boolean({ default: true }),
    ISSUER: Type.String({ default: "https://example.com" }),
    AUDIENCE: Type.Array(Type.String(), { default: ["1234", "5678"], separator: "," }),
    JWKS_URI: Type.String({ default: "https://example.com/path/to/jwks.json" }),
});

type Schema = Static<typeof schema>;

const getConfig = (): Schema => {
    return envSchema<Schema>({
        schema: schema,
        dotenv: true,
        ajv: {
            customOptions(ajvInstance) {
                ajvInstance.opts.strictTypes = false; // must be a better way
                return ajvInstance;
            },
        },
    });
};

export const config = getConfig();
