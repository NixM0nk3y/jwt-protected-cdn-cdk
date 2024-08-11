.EXPORT_ALL_VARIABLES:

# Meta tasks
# ----------

# Useful variables
export SAM_CLI_TELEMETRY ?= 0

# deployment environment
export ENVIRONMENT ?= production

# region
export AWS_REGION ?= eu-west-1

#
export AWS_ACCOUNT ?= 074705540277

# variable to steer the versions
export COMMIT ?= $(shell git rev-list -1 HEAD --abbrev-commit)
export BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)
export DATE=$(shell date -u '+%Y%m%d')


# variable that set the auth config
export JWKS_URI ?= https://example1.com/path/to/jwks.json
export ISSUER ?= https://example1.com
export AUDIENCE ?= 6789,3456

# Output helpers
# --------------

TASK_DONE = echo "✓  $@ done"
TASK_BUILD = echo "🛠️  $@ done"

# ----------------

.DEFAULT_GOAL := build

clean:
	@rm -rf cdk.out .aws-sam application
	@git clean -fdx
	@$(TASK_DONE)

test:
	go test -v -p 1 ./...
	@$(TASK_BUILD)

bootstrap:
	CDK_NEW_BOOTSTRAP=1 cdk bootstrap aws://$(AWS_ACCOUNT)/$(AWS_REGION) --require-approval never --cloudformation-execution-policies=arn:aws:iam::aws:policy/AdministratorAccess
	@$(TASK_BUILD)

diff: diff/application
	@$(TASK_DONE)

synth: synth/application
	@$(TASK_DONE)

deploy: deploy/application
	@$(TASK_DONE)

apply: deploy/application
	@$(TASK_DONE)

destroy: destroy/application
	@$(TASK_DONE)

synth/application: build
	cdk synth
	@$(TASK_BUILD)

diff/application: build
	cdk diff --all
	@$(TASK_BUILD)

deploy/application: build
	cdk deploy --all
	@$(TASK_BUILD)

destroy/application: build
	cdk destroy --all
	@$(TASK_BUILD)

ci/deploy/application: build
	cdk deploy --ci true --require-approval never --all
	@$(TASK_BUILD)

build: init
	@$(TASK_DONE)

init: 
	npm install
	@$(TASK_DONE)