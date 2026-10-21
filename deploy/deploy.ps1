param(
    [Parameter(Mandatory=$true)][string]$Region,
    [Parameter(Mandatory=$true)][string]$ParametersFile,
    [string]$StackName = 'cloudcampus',
    [string]$Repository = 'cloudcampus',
    [string]$ImageTag = 'release-20261012'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
}
$parameters = Get-Content -LiteralPath $ParametersFile -Raw | ConvertFrom-Json
$account = (& aws sts get-caller-identity --query Account --output text --region $Region).Trim()
if ($LASTEXITCODE -ne 0 -or $account -notmatch '^\d{12}$') { throw 'AWS identity check failed' }
$registry = "$account.dkr.ecr.$Region.amazonaws.com"
& aws ecr describe-repositories --repository-names $Repository --region $Region 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Invoke-Checked aws @('ecr','create-repository','--repository-name',$Repository,'--image-scanning-configuration','scanOnPush=true','--region',$Region)
}
$password = & aws ecr get-login-password --region $Region
if ($LASTEXITCODE -ne 0) { throw 'ECR authentication failed' }
$password | & docker login --username AWS --password-stdin $registry
if ($LASTEXITCODE -ne 0) { throw 'Container registry login failed' }
$password = $null
$image = "$registry/${Repository}:$ImageTag"
Invoke-Checked docker @('build','-t',$image,$projectRoot)
Invoke-Checked docker @('push',$image)
$parameters.ImageIdentifier = $image
try {
    $overrides = $parameters.PSObject.Properties | ForEach-Object { "$($_.Name)=$($_.Value)" }
    Invoke-Checked aws @('cloudformation','validate-template','--template-body',('file://' + (Join-Path $PSScriptRoot 'cloudformation.json')),'--region',$Region)
    $arguments = @('cloudformation','deploy','--stack-name',$StackName,'--template-file',(Join-Path $PSScriptRoot 'cloudformation.json'),'--capabilities','CAPABILITY_IAM','--region',$Region,'--parameter-overrides') + $overrides
    Invoke-Checked aws $arguments
    Invoke-Checked aws @('cloudformation','describe-stacks','--stack-name',$StackName,'--query','Stacks[0].Outputs','--output','table','--region',$Region)
} finally {
    & docker logout $registry | Out-Null
}
