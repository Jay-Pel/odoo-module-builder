#!/bin/bash
# n8n Setup Script for AWS Lightsail
# For Odoo Module Builder Project

set -e

echo "==============================================" 
echo "  Setting up n8n Workflow Engine"
echo "=============================================="

# Create directory for n8n data
mkdir -p ~/.n8n
mkdir -p ~/workflows

# Load configuration variables from deployment.conf
source ~/n8n.env

# Replace placeholders in n8n.env
DOMAIN_NAME=$(aws lightsail get-instance --instance-name "odoo-n8n-server" --query 'instance.publicIpAddress' --output text)
N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER:-admin}
N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-$(openssl rand -hex 12)}
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY:-$(openssl rand -hex 16)}

# Create real n8n .env file with replaced values
sed -e "s#{{DOMAIN_NAME}}#$DOMAIN_NAME#g" \
    -e "s#{{N8N_BASIC_AUTH_USER}}#$N8N_BASIC_AUTH_USER#g" \
    -e "s#{{N8N_BASIC_AUTH_PASSWORD}}#$N8N_BASIC_AUTH_PASSWORD#g" \
    -e "s#{{N8N_ENCRYPTION_KEY}}#$N8N_ENCRYPTION_KEY#g" \
    ~/n8n.env > ~/.n8n/.env

# Secure the .env file
chmod 600 ~/.n8n/.env

# Create systemd service file for n8n
cat > /tmp/n8n.service << 'EOF'
[Unit]
Description=n8n workflow automation
After=network.target redis.service postgresql.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
EnvironmentFile=/home/ec2-user/.n8n/.env
ExecStart=/home/ec2-user/.nvm/versions/node/v16.20.2/bin/n8n start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/n8n.service /etc/systemd/system/n8n.service

# Create worker service files if workers enabled
if grep -q "WORKERS_ENABLED=true" ~/.n8n/.env; then
    NUM_WORKERS=$(grep "NUM_WORKERS=" ~/.n8n/.env | cut -d '=' -f2)
    NUM_WORKERS=${NUM_WORKERS:-2}

    cat > /tmp/n8n-worker@.service << 'EOF'
[Unit]
Description=n8n worker %i
After=network.target redis.service postgresql.service n8n.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
EnvironmentFile=/home/ec2-user/.n8n/.env
ExecStart=/home/ec2-user/.nvm/versions/node/v16.20.2/bin/n8n worker
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/n8n-worker@.service /etc/systemd/system/n8n-worker@.service
    
    echo "Enabling $NUM_WORKERS worker services..."
    for i in $(seq 1 $NUM_WORKERS); do
        sudo systemctl enable n8n-worker@$i
    done
fi

# Configure Nginx as reverse proxy
cat > /tmp/nginx-n8n.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for n8n editor
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo mv /tmp/nginx-n8n.conf /etc/nginx/conf.d/n8n.conf
sudo rm -f /etc/nginx/conf.d/default.conf

# Create backup script
cat > ~/backup-n8n.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR=~/n8n-backups

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup n8n database
pg_dump -U n8n_user -h localhost n8n > $BACKUP_DIR/n8n-db-$TIMESTAMP.sql

# Backup n8n files and environment
tar -czf $BACKUP_DIR/n8n-data-$TIMESTAMP.tar.gz ~/.n8n

# Keep only the last 7 backups
ls -t $BACKUP_DIR/n8n-db-*.sql | tail -n +8 | xargs -r rm
ls -t $BACKUP_DIR/n8n-data-*.tar.gz | tail -n +8 | xargs -r rm
EOF

chmod +x ~/backup-n8n.sh

# Add to crontab
(crontab -l 2>/dev/null || echo "") | { cat; echo "0 2 * * * ~/backup-n8n.sh"; } | crontab -

# Enable and start n8n service
sudo systemctl daemon-reload
sudo systemctl enable n8n
sudo systemctl start n8n

# Start worker services if enabled
if grep -q "WORKERS_ENABLED=true" ~/.n8n/.env; then
    NUM_WORKERS=$(grep "NUM_WORKERS=" ~/.n8n/.env | cut -d '=' -f2)
    NUM_WORKERS=${NUM_WORKERS:-2}
    
    for i in $(seq 1 $NUM_WORKERS); do
        sudo systemctl start n8n-worker@$i
    done
fi

# Restart Nginx
sudo systemctl restart nginx

echo "==============================================" 
echo "  n8n Setup Completed Successfully"
echo "  Username: $N8N_BASIC_AUTH_USER"
echo "  Password: $N8N_BASIC_AUTH_PASSWORD"
echo "=============================================="
