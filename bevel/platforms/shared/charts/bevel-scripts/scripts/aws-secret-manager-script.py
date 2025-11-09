import boto3
from botocore.exceptions import ClientError
import argparse
import json

# Initialize the Secrets Manager client as a global variable to be used across all CRUD operations
client = None

# Create a new secret
def create_secret(secret_name, secret_value):
    try:
        response = client.create_secret(
            Name=secret_name,
            Description="My application secret",
            SecretString=secret_value
        )
        print(f"Secret {secret_name} created successfully!")
        print(f"response {response}")
        return response
    except ClientError as e:
        print(f"Error creating secret: {e}")
        return None

# Retrieve an existing secret
def get_secret(secret_name):
    try:
        response = client.get_secret_value(SecretId=secret_name)
        secret = response['SecretString']
        print(f"Retrieved secret: {secret}")
        return secret
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        return None

# Update an existing secret
def update_secret(secret_name, new_secret_value):
    try:
        response = client.update_secret(
            SecretId=secret_name,
            SecretString=new_secret_value
        )
        print(f"Secret {secret_name} updated successfully!")
        print(f"response {response}")
        return response
    except ClientError as e:
        print(f"Error updating secret: {e}")
        return None

# Delete an existing secret
def delete_secret(secret_name):
    try:
        response = client.delete_secret(
            SecretId=secret_name,
            ForceDeleteWithoutRecovery=True
        )
        print(f"Secret {secret_name} scheduled for deletion!")
        return response
    except ClientError as e:
        print(f"Error deleting secret: {e}")
        return None

# Main entry point to handle different secret management operations
if __name__ == "__main__":
    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(description='Manage AWS Secrets')
    # Define required arguments: region_name, operation (create/get/update/delete) and secret_name
    parser.add_argument('region_name', help='AWS region name (e.g., us-east-1, eu-central-1)')
    parser.add_argument('operation', choices=['create_secret', 'get_secret', 'update_secret', 'delete_secret'], help='Operation to perform')
    parser.add_argument('secret_name', help='Name of the secret')
    # Optional argument for secret value, required only for create and update operations
    parser.add_argument('secret_value', nargs='?', default=None, help='Value of the secret (required for create and update)')
    # Parse command-line arguments
    args = parser.parse_args()
    
    # Set the Secrets Manager client with the AWS region specified by the user
    # This allows the client to interact with Secrets Manager in the specified region
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=args.region_name  # Dynamically set the region based on user input
    )
    
    # Check if secret_value is provided and if it's a JSON file path
    secret_value = args.secret_value
    if secret_value and secret_value.endswith('.json'):
        try:
            # If a JSON file is provided, read and convert it to a JSON string
            with open(secret_value, 'r') as f:
                secret_value = json.dumps(json.load(f))
        except FileNotFoundError:
            # Handle case when the JSON file is not found
            print(f"Error: File {secret_value} not found.")
            exit(1)
    
    # Execute the chosen operation based on the command-line input
    if args.operation == 'create_secret':
        create_secret(args.secret_name, secret_value)
    elif args.operation == 'get_secret':
        get_secret(args.secret_name)
    elif args.operation == 'update_secret':
        update_secret(args.secret_name, secret_value)
    elif args.operation == 'delete_secret':
        delete_secret(args.secret_name)
