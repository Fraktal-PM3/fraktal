# `Integrating AWS Secrets Manager with an EKS Cluster`

This guide walks you through the steps needed to create IAM policies, trust policies, and roles to securely integrate AWS Secrets Manager with your EKS cluster. By following these steps, you will enable your EKS workloads to securely access secrets stored in AWS Secrets Manager using OpenID Connect (OIDC) authentication.

## Step 1: Create the `policy.json` File

The `policy.json` file defines the permissions required to interact with AWS Secrets Manager. The IAM policy allows specific actions on all secrets within a region under your account.

### `policy.json` content:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:UntagResource",
                "secretsmanager:DescribeSecret",
                "secretsmanager:PutSecretValue",
                "secretsmanager:CreateSecret",
                "secretsmanager:DeleteSecret",
                "secretsmanager:CancelRotateSecret",
                "secretsmanager:ListSecretVersionIds",
                "secretsmanager:UpdateSecret",
                "secretsmanager:GetResourcePolicy",
                "secretsmanager:GetSecretValue",
                "secretsmanager:StopReplicationToReplica",
                "secretsmanager:ReplicateSecretToRegions",
                "secretsmanager:RestoreSecret",
                "secretsmanager:RotateSecret",
                "secretsmanager:UpdateSecretVersionStage",
                "secretsmanager:RemoveRegionsFromReplication",
                "secretsmanager:TagResource"
            ],
            "Resource": "arn:aws:secretsmanager:<region>:<account-id>:secret:*"
        }
    ]
}
```

### Notes:
- **Replace `<account-id>`**: Your actual AWS account ID.
- **Replace `<region>`**: AWS region where your secret is stored.


## Step 2: Create the Secrets Manager Policy

Now that you have the `policy.json` file, create the IAM policy using the AWS CLI.

### Command:

```bash
aws iam create-policy --policy-name BevelSecretsManagerAccessPolicy --policy-document file://<path-of-policy.json-file>
```

### Notes:
- **Replace `<path-of-policy.json-file>`**: Path to the `policy.json` file created in Step 1.
- This command creates an IAM policy named `BevelSecretsManagerAccessPolicy` with the specified permissions.


## Step 3: Create the `trust-policy.json` file

Creates a trust policy to allow role assumption through OpenID Connect (OIDC).

### `trust-policy.json` content:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::<account-id>:oidc-provider/<OpenID-Connect-provider-URL>"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "<OpenID-Connect-provider-URL>:aud": "sts.amazonaws.com"
                }
            }
        }
    ]
}
```

### Notes:
- **Replace `<account-id>`**: Use your AWS account ID.
- **Replace `<OpenID-Connect-provider-URL>`**: 
  - Insert your OpenID Connect provider URL without the `https://` prefix.
  - For example, if your provider URL is `https://oidc.eks.eu-north-1.amazonaws.com/id/ABC1234567890`, you would use `oidc.eks.eu-north-1.amazonaws.com/id/ABC1234567890`.

## Step 4: Create an IAM Role

Once the trust policy is configured, create a IAM role that can assume this trust policy.

### Command:

```bash
aws iam create-role --role-name BevelEKSSecretsRole --assume-role-policy-document file://<path-to-trust-policy.json>
```

### Notes:
- **Replace `<path-to-trust-policy.json>`**: Path to the `trust-policy.json` file created in Step 3.
- **Role Name**: The role created is named `BevelEKSSecretsRole`.

This role now has the ability to assume the trust relationship defined by the OpenID Connect provider.


## Step 5: Attach the Secrets Manager Policy to the IAM Role

After creating the role, attach the previously created `BevelSecretsManagerAccessPolicy` to the role `BevelEKSSecretsRole`, granting it the necessary permissions to manage AWS Secrets.

### Command:

```bash
aws iam attach-role-policy --role-name BevelEKSSecretsRole --policy-arn arn:aws:iam::<account-id>:policy/BevelSecretsManagerAccessPolicy
```

### Notes:
- **Replace `<account-id>`**: Ensure you substitute `<account-id>` with your AWS account ID.
- The policy **`BevelSecretsManagerAccessPolicy`** is now attached to the role **`BevelEKSSecretsRole`**, allowing it to perform actions defined in the `policy.json` file.
---
