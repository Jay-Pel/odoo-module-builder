import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Download, CheckCircle, AlertCircle, DollarSign, FileText } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ projectId, pricing, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, [projectId]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.client_secret);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (stripeError) {
      setError(stripeError.message);
      setIsProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
        
        <div className="bg-white border border-gray-300 rounded-md p-3">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-white font-medium ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ${pricing?.final_price?.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
};

const PricingBreakdown = ({ pricing }) => {
  if (!pricing) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2" />
        Pricing Breakdown
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Base Price</span>
          <span className="font-medium">${pricing.base_price.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Complexity Score</span>
          <span className="font-medium">{pricing.complexity_score}/100</span>
        </div>
        
        {pricing.pricing_breakdown && (
          <div className="border-t pt-3 mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Complexity Factors</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(pricing.pricing_breakdown.complexity_analysis || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between text-gray-600">
                  <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-green-600">${pricing.final_price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentInterface = ({ projectId, pricingData, onComplete, onError }) => {
  const [pricing, setPricing] = useState(pricingData || null);
  const [paymentStatus, setPaymentStatus] = useState('not_started');
  const [isLoading, setIsLoading] = useState(!pricingData);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    if (pricingData) {
      setPricing(pricingData);
      setIsLoading(false);
    } else {
      fetchPricing();
    }
    checkPaymentStatus();
  }, [projectId, pricingData]);

  const fetchPricing = async () => {
    try {
      const response = await fetch(`/api/uat/pricing/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/status/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data.payment_status);
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    setPaymentStatus('completed');
    
    // Poll for payment confirmation
    const pollPayment = async () => {
      try {
        const response = await fetch(`/api/payments/status/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.payment_status === 'completed') {
            setPaymentStatus('completed');
            if (onDownloadReady) {
              onDownloadReady();
            }
          } else {
            // Continue polling
            setTimeout(pollPayment, 2000);
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    };

    pollPayment();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/payments/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate download URL');
      }

      const data = await response.json();
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadUrl(data.download_url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'completed') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-green-800">Payment Successful!</h3>
              <p className="text-green-600 mt-1">Your module is ready for download.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Download Your Module</h3>
          <p className="text-gray-600 mb-4">
            Your Odoo module has been generated and is ready for download. The module includes all the files needed to install it in your Odoo instance.
          </p>
          
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            <Download className="w-5 h-5" />
            <span>Download Module</span>
          </button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Installation Instructions
          </h3>
          <div className="prose text-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>Extract the downloaded ZIP file to your Odoo addons directory</li>
              <li>Restart your Odoo server</li>
              <li>Go to Apps menu in Odoo and update the app list</li>
              <li>Search for your module and click Install</li>
              <li>Configure the module according to your needs</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Purchase</h2>
        <p className="text-gray-600">
          Your module has passed all tests and is ready for purchase. Complete the payment to download your custom Odoo module.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PricingBreakdown pricing={pricing} />
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment
          </h3>
          
          <Elements stripe={stripePromise}>
            <PaymentForm
              projectId={projectId}
              pricing={pricing}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </Elements>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">What's Included</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Complete Odoo module with all requested features</li>
          <li>• Full source code and documentation</li>
          <li>• Installation and configuration instructions</li>
          <li>• Tested and validated functionality</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentInterface; 