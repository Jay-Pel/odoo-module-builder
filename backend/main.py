import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import modules
from api.chat import chat_bp
from api.specification import specification_bp
from api.development_plan import development_plan_bp
from api.module_generator import module_generator_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(specification_bp, url_prefix='/api/specification')
app.register_blueprint(development_plan_bp, url_prefix='/api/development-plan')
app.register_blueprint(module_generator_bp, url_prefix='/api/module-generator')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Odoo Module Builder API is running'
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'name': 'Odoo Module Builder API',
        'version': '1.0.0',
        'description': 'API for generating custom Odoo ERP modules'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5678))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)