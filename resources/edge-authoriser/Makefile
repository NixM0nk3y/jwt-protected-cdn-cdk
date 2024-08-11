.EXPORT_ALL_VARIABLES:

# deployment environment
ENVIRONMENT ?= dev

export COMMIT ?= $(shell git rev-list -1 HEAD --abbrev-commit)
export BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)
export DATE ?= $(shell date -u '+%Y%m%d')

ARTIFACTS_DIR ?= /asset-output

# Output helpers
# --------------

TASK_DONE = echo "✓  $@ done"
TASK_BUILD = echo "🛠️  $@ done"

all: build

clean:
	rm -rf dist node_modules

deps:
	npm ci
	@$(TASK_DONE)

version: 
	COMMIT=$(COMMIT) BRANCH=$(BRANCH) DATE=$(DATE) ./scripts/version.sh

build: deps
	npm run build
	@$(TASK_BUILD)

bundle: deps
	npm run bundle
	@$(TASK_BUILD)

bundle-lambda: version bundle
	echo ISSUER=${ISSUER} | tee ${ARTIFACTS_DIR}/.env
	echo AUDIENCE=${AUDIENCE} | tee -a ${ARTIFACTS_DIR}/.env
	echo JWKS_URI=${JWKS_URI} | tee -a ${ARTIFACTS_DIR}/.env
	cp ./dist/lambda.mjs ${ARTIFACTS_DIR}/
	@$(TASK_BUILD)

test: build
	npm run test
	@$(TASK_BUILD)