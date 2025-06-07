from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict
import stripe
import os
import logging
import httpx
import hmac
import hashlib
from datetime import datetime

from services.database import DatabaseService
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter(prefix="/payments", tags=["payments"])

# Request/Response Models
class PaymentIntentRequest(BaseModel):
    project_id: str

class PaymentIntentResponse(BaseModel):
    client_secret: str
    amount: int
    currency: str = "usd"

class DownloadRequest(BaseModel):
    project_id: str

class DownloadResponse(BaseModel):
    download_url: str
    expires_in: int
    filename: str

# Payment Processing

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_request: PaymentIntentRequest,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Create a Stripe payment intent for a project"""
    try:
        # Verify project ownership
        project = await db.get_project(payment_request.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Check if project is ready for payment
        if project["status"] not in ["uat_completed", "uat_active"]:
            raise HTTPException(status_code=400, detail="Project must complete UAT before payment")
        
        # Get pricing for the project
        pricing = await db.get_project_pricing(payment_request.project_id)
        if not pricing:
            raise HTTPException(status_code=400, detail="Pricing not calculated for this project")
        
        # Check if already paid
        existing_payment = await db.get_project_payment(payment_request.project_id)
        if existing_payment and existing_payment["status"] == "completed":
            raise HTTPException(status_code=400, detail="Project already paid for")
        
        # Create Stripe payment intent
        amount_cents = int(pricing["final_price"] * 100)  # Convert to cents
        
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            metadata={
                "project_id": payment_request.project_id,
                "user_id": current_user["user_id"],
                "pricing_id": pricing["id"]
            },
            description=f"Odoo Module for Project {project['name']}"
        )
        
        # Save payment intent to database
        await db.create_payment_record(
            project_id=payment_request.project_id,
            user_id=current_user["user_id"],
            stripe_payment_intent_id=payment_intent.id,
            amount=pricing["final_price"],
            currency="usd",
            status="pending"
        )
        
        logger.info(f"Payment intent created for project {payment_request.project_id}: {payment_intent.id}")
        
        return PaymentIntentResponse(
            client_secret=payment_intent.client_secret,
            amount=amount_cents,
            currency="usd"
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating payment intent: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment processing error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment intent: {str(e)}")

@router.get("/status/{project_id}")
async def get_payment_status(
    project_id: str,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Get payment status for a project"""
    try:
        # Verify project ownership
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Get payment record
        payment = await db.get_project_payment(project_id)
        if not payment:
            return {
                "project_id": project_id,
                "payment_status": "not_started",
                "amount": None,
                "currency": None
            }
        
        return {
            "project_id": project_id,
            "payment_status": payment["status"],
            "amount": payment["amount"],
            "currency": payment["currency"],
            "paid_at": payment.get("paid_at"),
            "stripe_payment_intent_id": payment["stripe_payment_intent_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get payment status: {str(e)}")

# Module Download

@router.post("/download", response_model=DownloadResponse)
async def download_module(
    download_request: DownloadRequest,
    current_user: Dict = Depends(get_current_user),
    db: DatabaseService = Depends(DatabaseService)
):
    """Generate a secure download URL for a paid module"""
    try:
        # Verify project ownership
        project = await db.get_project(download_request.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Verify payment status
        payment = await db.get_project_payment(download_request.project_id)
        if not payment or payment["status"] != "completed":
            raise HTTPException(status_code=402, detail="Payment required to download module")
        
        # Get the latest module version
        module_version = await db.get_latest_module_version(download_request.project_id)
        if not module_version:
            raise HTTPException(status_code=404, detail="Module not found")
        
        # Generate presigned download URL (implementation depends on storage backend)
        # For Cloudflare R2, this would be a presigned URL
        r2_key = module_version["r2_key"]
        
        # Generate presigned URL (placeholder - actual implementation depends on R2 SDK)
        download_url = f"https://your-r2-bucket.com/{r2_key}?presigned=true"
        
        # Record download event
        await db.record_module_download(
            project_id=download_request.project_id,
            user_id=current_user["user_id"],
            module_version_id=module_version["id"]
        )
        
        logger.info(f"Module download initiated for project {download_request.project_id}")
        
        return DownloadResponse(
            download_url=download_url,
            expires_in=3600,  # 1 hour
            filename=f"{project['name']}_module.zip"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating download URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")

# Webhook Handling

@router.post("/stripe-webhook")
async def handle_stripe_webhook(
    request: Request,
    db: DatabaseService = Depends(DatabaseService)
):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        if not sig_header or not webhook_secret:
            raise HTTPException(status_code=400, detail="Missing signature or webhook secret")
        
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            logger.error("Invalid payload in Stripe webhook")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature in Stripe webhook")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle payment intent events
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            await handle_payment_success(payment_intent, db)
        
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            await handle_payment_failure(payment_intent, db)
        
        else:
            logger.info(f"Unhandled Stripe event type: {event['type']}")
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling Stripe webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

# Helper functions

async def handle_payment_success(payment_intent: Dict, db: DatabaseService):
    """Handle successful payment"""
    try:
        project_id = payment_intent["metadata"]["project_id"]
        user_id = payment_intent["metadata"]["user_id"]
        
        # Update payment record
        await db.update_payment_status(
            stripe_payment_intent_id=payment_intent["id"],
            status="completed",
            paid_at=datetime.now()
        )
        
        # Update project status
        await db.update_project_status(project_id, "paid")
        
        logger.info(f"Payment successful for project {project_id}: {payment_intent['id']}")
        
    except Exception as e:
        logger.error(f"Error handling payment success: {str(e)}")
        raise

async def handle_payment_failure(payment_intent: Dict, db: DatabaseService):
    """Handle failed payment"""
    try:
        project_id = payment_intent["metadata"]["project_id"]
        
        # Update payment record
        await db.update_payment_status(
            stripe_payment_intent_id=payment_intent["id"],
            status="failed"
        )
        
        logger.info(f"Payment failed for project {project_id}: {payment_intent['id']}")
        
    except Exception as e:
        logger.error(f"Error handling payment failure: {str(e)}")
        raise 