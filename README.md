# Odoo Module Builder

A tool for creating and managing Odoo modules with a user-friendly interface.

## Features

- Create new Odoo modules with a simple UI
- Manage module dependencies
- Generate model definitions
- Build views and menus
- Export modules for installation in Odoo

## Getting Started

### Prerequisites

- Node.js
- Python 3.x

### Installation

1. Clone the repository
```bash
git clone https://github.com/Jay-Pel/odoo-module-builder.git
cd odoo-module-builder
```

2. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend
python app.py
```

2. Start the frontend development server
```bash
cd frontend
./start-on-port.sh
```

The application will be available at http://localhost:3457

## License

This project is licensed under the MIT License - see the LICENSE file for details.