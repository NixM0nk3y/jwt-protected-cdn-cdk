/** @type {import('ts-jest').JestConfigWithTsJest} **/
const esModules = ["@middy"].join("|");
module.exports = {
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.ts?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    transformIgnorePatterns: [`node_modules/(?!${esModules})`],
    collectCoverageFrom: ["./src/**"],
    coverageThreshold: {
        "./src": {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
};
