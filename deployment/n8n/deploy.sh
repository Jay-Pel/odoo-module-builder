#!/bin/bash
# n8n Deployment Script for AWS Lightsail
# For Odoo Module Builder Project

set -e

echo "==============================================" 
echo "  n8n Deployment for Odoo Module Builder"
echo "  AWS Lightsail Setup"
echo "=============================================="

# Load configuration
source ./configs/deployment.conf

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if the user is authenticated with AWS
aws sts get-caller-identity > /dev/null || {
    echo "You are not authenticated with AWS. Please run 'aws configure' first."
    exit 1
}

# Create Lightsail instance
echo "Creating AWS Lightsail instance for n8n..."
aws lightsail create-instances \
  --instance-names "$INSTANCE_NAME" \
  --availability-zone "$AVAILABILITY_ZONE" \
  --blueprint-id "$BLUEPRINT_ID" \
  --bundle-id "$BUNDLE_ID" \
  --tags key=purpose,value=n8n-workflow-engine

echo "Waiting for instance to become available..."
aws lightsail wait instance-available --instance-name "$INSTANCE_NAME"

# Get instance public IP
PUBLIC_IP=$(aws lightsail get-instance --instance-name "$INSTANCE_NAME" --query 'instance.publicIpAddress' --output text)
echo "Instance created successfully with IP: $PUBLIC_IP"

# Open necessary ports
echo "Configuring firewall rules..."
aws lightsail open-instance-public-ports \
  --instance-name "$INSTANCE_NAME" \
  --port-info fromPort=22,toPort=22,protocol=TCP
aws lightsail open-instance-public-ports \
  --instance-name "$INSTANCE_NAME" \
  --port-info fromPort=80,toPort=80,protocol=TCP
aws lightsail open-instance-public-ports \
  --instance-name "$INSTANCE_NAME" \
  --port-info fromPort=443,toPort=443,protocol=TCP

# Create SSH key if it doesn't exist
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "Creating SSH key for Lightsail instance..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N ""
    aws lightsail import-key-pair \
      --key-pair-name "$KEY_PAIR_NAME" \
      --public-key-base64 "$(cat ${SSH_KEY_PATH}.pub | base64)"
fi

echo "Waiting for SSH service to be ready..."
sleep 60  # Give some time for SSH to be available

# Upload installation and configuration scripts
echo "Uploading installation scripts..."
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ./scripts/install-dependencies.sh ec2-user@$PUBLIC_IP:~/
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ./scripts/setup-n8n.sh ec2-user@$PUBLIC_IP:~/
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ./configs/n8n.env ec2-user@$PUBLIC_IP:~/
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ./configs/nginx-n8n.conf ec2-user@$PUBLIC_IP:~/

# Run installation scripts
echo "Installing dependencies and setting up n8n..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP 'chmod +x ~/install-dependencies.sh && sudo ~/install-dependencies.sh'
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP 'chmod +x ~/setup-n8n.sh && ~/setup-n8n.sh'

# Install SSL certificate if domain is configured
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "Setting up SSL certificate for $DOMAIN_NAME..."
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP "sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $ADMIN_EMAIL"
fi

# Import n8n workflows
if [ "$IMPORT_WORKFLOWS" = "true" ]; then
    echo "Importing n8n workflows..."
    scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -r ./workflows/* ec2-user@$PUBLIC_IP:~/workflows/
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP 'cd ~/workflows && for f in *.json; do n8n import:workflow --input="$f"; done'
fi

# Setting up monitoring
echo "Setting up monitoring..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP 'npm install -g pm2 && pm2 start "n8n start" --name "n8n-main" && pm2 save && pm2 startup'

echo "==============================================" 
echo "  n8n Deployment Completed Successfully"
echo "  Access n8n at: http://$PUBLIC_IP:5678"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "  Or at: https://$DOMAIN_NAME"
fi
echo "  Username: $N8N_BASIC_AUTH_USER"
echo "  Password: $N8N_BASIC_AUTH_PASSWORD (stored in configs/n8n.env)"
echo "=============================================="
